use serde::Serialize;
use std::{collections::HashSet, path::Path};

const MIB: u64 = 1024 * 1024;
const GIB: u64 = 1024 * MIB;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum StorageState {
    Normal,
    Low,
    Critical,
    ReadOnly,
    Unknown,
}

#[derive(Debug, Serialize)]
pub struct StorageVolume {
    name: String,
    mount_point: String,
    total_bytes: u64,
    free_bytes: u64,
    read_only: bool,
    total_inodes: Option<u64>,
    free_inodes: Option<u64>,
    state: StorageState,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct MountEntry {
    mount_point: String,
    fs_type: String,
    source: String,
    read_only: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct FilesystemMetrics {
    total_bytes: u64,
    free_bytes: u64,
    total_inodes: Option<u64>,
    free_inodes: Option<u64>,
}

fn decode_mount_field(value: &str) -> String {
    value
        .replace("\\040", " ")
        .replace("\\011", "\t")
        .replace("\\012", "\n")
        .replace("\\134", "\\")
}

fn has_mount_option(options: &str, expected: &str) -> bool {
    options.split(',').any(|option| option == expected)
}

fn parse_mountinfo_line(line: &str) -> Option<MountEntry> {
    let (left, right) = line.split_once(" - ")?;
    let left_fields: Vec<_> = left.split_whitespace().collect();
    let right_fields: Vec<_> = right.split_whitespace().collect();
    if left_fields.len() < 6 || right_fields.len() < 2 {
        return None;
    }

    Some(MountEntry {
        mount_point: decode_mount_field(left_fields[4]),
        fs_type: right_fields[0].to_string(),
        source: decode_mount_field(right_fields[1]),
        read_only: has_mount_option(left_fields[5], "ro"),
    })
}

fn is_pseudo_filesystem(fs_type: &str) -> bool {
    matches!(
        fs_type,
        "proc"
            | "sysfs"
            | "devtmpfs"
            | "devpts"
            | "tmpfs"
            | "cgroup"
            | "cgroup2"
            | "pstore"
            | "securityfs"
            | "debugfs"
            | "tracefs"
            | "configfs"
            | "fusectl"
            | "mqueue"
            | "hugetlbfs"
            | "ramfs"
            | "autofs"
            | "binfmt_misc"
            | "nsfs"
            | "squashfs"
            | "efivarfs"
            | "bpf"
    )
}

fn is_network_filesystem(fs_type: &str) -> bool {
    matches!(
        fs_type,
        "nfs" | "nfs4" | "cifs" | "smb3" | "9p" | "virtiofs" | "fuse.sshfs"
    )
}

fn is_storage_mount(entry: &MountEntry) -> bool {
    if is_network_filesystem(&entry.fs_type) {
        return false;
    }

    // Der aktive Wurzel-Mount bleibt sichtbar, auch wenn eine virtualisierte
    // Prüfumgebung seine echte Blockquelle abstrahiert.
    if entry.mount_point == "/" {
        return true;
    }

    !is_pseudo_filesystem(&entry.fs_type) && entry.source.starts_with("/dev/")
}

fn selected_mounts(contents: &str) -> Vec<MountEntry> {
    let mut seen_sources = HashSet::new();
    let mut mounts = Vec::new();

    for entry in contents.lines().filter_map(parse_mountinfo_line) {
        if !is_storage_mount(&entry) {
            continue;
        }

        let key = if entry.source.starts_with("/dev/") {
            entry.source.clone()
        } else {
            entry.mount_point.clone()
        };
        if seen_sources.insert(key) {
            mounts.push(entry);
        }
    }

    mounts.sort_by(|left, right| {
        let left_root = left.mount_point != "/";
        let right_root = right.mount_point != "/";
        left_root
            .cmp(&right_root)
            .then_with(|| left.mount_point.cmp(&right.mount_point))
    });
    mounts
}

fn display_name(entry: &MountEntry) -> String {
    if entry.mount_point == "/" {
        return "Systemdatenträger".to_string();
    }

    Path::new(&entry.mount_point)
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.trim().is_empty())
        .map(ToOwned::to_owned)
        .or_else(|| {
            Path::new(&entry.source)
                .file_name()
                .and_then(|name| name.to_str())
                .map(ToOwned::to_owned)
        })
        .unwrap_or_else(|| "Datenträger".to_string())
}

fn clamped_percentage(total: u64, percent: u64, minimum: u64, maximum: u64) -> u64 {
    let value = (total as u128)
        .saturating_mul(percent as u128)
        .saturating_div(100);
    value
        .clamp(minimum as u128, maximum as u128)
        .min(u64::MAX as u128) as u64
}

fn inode_state(total_inodes: Option<u64>, free_inodes: Option<u64>) -> Option<StorageState> {
    let (total, free) = match (total_inodes, free_inodes) {
        (Some(total), Some(free)) if total > 0 => (total, free),
        _ => return None,
    };

    if free > total {
        return Some(StorageState::Unknown);
    }

    let free_scaled = (free as u128).saturating_mul(100);
    let total_scaled = total as u128;
    if free_scaled <= total_scaled.saturating_mul(5) {
        Some(StorageState::Critical)
    } else if free_scaled <= total_scaled.saturating_mul(10) {
        Some(StorageState::Low)
    } else {
        Some(StorageState::Normal)
    }
}

fn evaluate_storage_state(
    total_bytes: u64,
    free_bytes: u64,
    read_only: bool,
    total_inodes: Option<u64>,
    free_inodes: Option<u64>,
) -> StorageState {
    if read_only {
        return StorageState::ReadOnly;
    }
    if total_bytes == 0 || free_bytes > total_bytes {
        return StorageState::Unknown;
    }

    let critical_threshold = clamped_percentage(total_bytes, 3, 512 * MIB, 20 * GIB);
    let warn_threshold = clamped_percentage(total_bytes, 10, 2 * GIB, 100 * GIB);
    let byte_state = if free_bytes <= critical_threshold {
        StorageState::Critical
    } else if free_bytes <= warn_threshold {
        StorageState::Low
    } else {
        StorageState::Normal
    };

    match inode_state(total_inodes, free_inodes) {
        Some(StorageState::Unknown) => StorageState::Unknown,
        Some(StorageState::Critical) => StorageState::Critical,
        Some(StorageState::Low) if byte_state == StorageState::Normal => StorageState::Low,
        _ => byte_state,
    }
}

#[cfg(target_os = "linux")]
fn filesystem_metrics(mount_point: &str) -> Result<FilesystemMetrics, String> {
    use std::{ffi::CString, mem::MaybeUninit};

    let path = CString::new(mount_point.as_bytes())
        .map_err(|_| "Einhängeort enthält ungültige Zeichen".to_string())?;
    let mut info = MaybeUninit::<libc::statvfs>::uninit();

    // SAFETY: `path` ist eine gültige, nullterminierte Zeichenkette und `info`
    // zeigt auf ausreichend großen Speicher für genau einen `statvfs`-Datensatz.
    let result = unsafe { libc::statvfs(path.as_ptr(), info.as_mut_ptr()) };
    if result != 0 {
        return Err(format!(
            "Speicherangaben für {mount_point} konnten nicht gelesen werden"
        ));
    }

    // SAFETY: Bei Rückgabewert 0 hat `statvfs` den Datensatz vollständig befüllt.
    let info = unsafe { info.assume_init() };
    let block_size = info.f_frsize as u128;
    let total = (info.f_blocks as u128).saturating_mul(block_size);
    let free = (info.f_bavail as u128).saturating_mul(block_size);
    let total_bytes = total.min(u64::MAX as u128) as u64;
    let free_bytes = (free.min(u64::MAX as u128) as u64).min(total_bytes);
    let total_inodes = info.f_files as u64;
    let free_inodes = info.f_favail as u64;
    let inode_values = (total_inodes > 0).then_some((total_inodes, free_inodes.min(total_inodes)));

    Ok(FilesystemMetrics {
        total_bytes,
        free_bytes,
        total_inodes: inode_values.map(|(total, _)| total),
        free_inodes: inode_values.map(|(_, free)| free),
    })
}

#[cfg(not(target_os = "linux"))]
fn filesystem_metrics(_mount_point: &str) -> Result<FilesystemMetrics, String> {
    Err("Speicherübersicht ist in diesem Stand nur für Linux freigegeben".to_string())
}

#[cfg(target_os = "linux")]
pub fn list_storage_volumes() -> Result<Vec<StorageVolume>, String> {
    let mountinfo = std::fs::read_to_string("/proc/self/mountinfo").map_err(|error| {
        format!("Eingehängte Datenträger konnten nicht gelesen werden: {error}")
    })?;

    let volumes: Vec<_> = selected_mounts(&mountinfo)
        .into_iter()
        .filter_map(|entry| {
            let metrics = filesystem_metrics(&entry.mount_point).ok()?;
            (metrics.total_bytes > 0).then(|| {
                let state = evaluate_storage_state(
                    metrics.total_bytes,
                    metrics.free_bytes,
                    entry.read_only,
                    metrics.total_inodes,
                    metrics.free_inodes,
                );
                StorageVolume {
                    name: display_name(&entry),
                    mount_point: entry.mount_point,
                    total_bytes: metrics.total_bytes,
                    free_bytes: metrics.free_bytes,
                    read_only: entry.read_only,
                    total_inodes: metrics.total_inodes,
                    free_inodes: metrics.free_inodes,
                    state,
                }
            })
        })
        .collect();

    if volumes.is_empty() {
        return Err("Kein lesbarer lokaler Datenträger wurde gefunden".to_string());
    }

    Ok(volumes)
}

#[cfg(not(target_os = "linux"))]
pub fn list_storage_volumes() -> Result<Vec<StorageVolume>, String> {
    Err("Speicherübersicht ist in diesem Stand nur für Linux freigegeben".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "36 25 8:1 / / rw,relatime - ext4 /dev/sda1 rw\n\
44 36 0:32 / /proc rw,nosuid - proc proc rw\n\
45 36 0:33 / /sys rw,nosuid - sysfs sysfs rw\n\
52 36 8:17 / /media/test/Meine\\040Daten rw,relatime - ext4 /dev/sdb1 rw\n\
53 36 0:44 / /run/user/1000 rw,nosuid - tmpfs tmpfs rw\n\
54 36 0:50 / /mnt/netz rw,relatime - nfs4 server:/share rw\n\
55 36 7:0 / /tmp/.mount_app ro,relatime - squashfs /dev/loop0 ro";

    #[test]
    fn parser_decodes_mount_names_and_filters_non_storage_mounts() {
        let mounts = selected_mounts(SAMPLE);
        assert_eq!(mounts.len(), 2);
        assert_eq!(mounts[0].mount_point, "/");
        assert_eq!(mounts[1].mount_point, "/media/test/Meine Daten");
        assert_eq!(mounts[1].source, "/dev/sdb1");
    }

    #[test]
    fn parser_reads_read_only_mount_flag() {
        let entry = parse_mountinfo_line(
            "60 36 8:33 / /media/test/Archiv ro,relatime - ext4 /dev/sdc1 ro",
        )
        .expect("gültiger Mount-Eintrag");
        assert!(entry.read_only);
    }

    #[test]
    fn visible_names_are_simple_and_root_is_explicit() {
        let mounts = selected_mounts(SAMPLE);
        assert_eq!(display_name(&mounts[0]), "Systemdatenträger");
        assert_eq!(display_name(&mounts[1]), "Meine Daten");
    }

    #[test]
    fn duplicate_device_sources_are_shown_only_once() {
        let mounts = selected_mounts(
            "1 0 8:1 / / rw - ext4 /dev/sda1 rw\n2 1 8:1 /home /home rw - ext4 /dev/sda1 rw",
        );
        assert_eq!(mounts.len(), 1);
        assert_eq!(mounts[0].mount_point, "/");
    }

    #[test]
    fn read_only_always_wins_over_capacity_warnings() {
        assert_eq!(
            evaluate_storage_state(8 * GIB, 0, true, Some(100), Some(0)),
            StorageState::ReadOnly
        );
    }

    #[test]
    fn invalid_byte_values_are_unknown() {
        assert_eq!(
            evaluate_storage_state(0, 0, false, None, None),
            StorageState::Unknown
        );
        assert_eq!(
            evaluate_storage_state(8 * GIB, 9 * GIB, false, None, None),
            StorageState::Unknown
        );
    }

    #[test]
    fn small_volume_uses_absolute_minimum_thresholds() {
        assert_eq!(
            evaluate_storage_state(8 * GIB, 512 * MIB, false, None, None),
            StorageState::Critical
        );
        assert_eq!(
            evaluate_storage_state(8 * GIB, 512 * MIB + 1, false, None, None),
            StorageState::Low
        );
        assert_eq!(
            evaluate_storage_state(8 * GIB, 2 * GIB + 1, false, None, None),
            StorageState::Normal
        );
    }

    #[test]
    fn large_volume_uses_absolute_maximum_thresholds() {
        let eight_tib = 8 * 1024 * GIB;
        assert_eq!(
            evaluate_storage_state(eight_tib, 20 * GIB, false, None, None),
            StorageState::Critical
        );
        assert_eq!(
            evaluate_storage_state(eight_tib, 20 * GIB + 1, false, None, None),
            StorageState::Low
        );
        assert_eq!(
            evaluate_storage_state(eight_tib, 100 * GIB + 1, false, None, None),
            StorageState::Normal
        );
    }

    #[test]
    fn inode_pressure_can_raise_the_storage_state() {
        assert_eq!(
            evaluate_storage_state(256 * GIB, 100 * GIB, false, Some(1_000), Some(100)),
            StorageState::Low
        );
        assert_eq!(
            evaluate_storage_state(256 * GIB, 100 * GIB, false, Some(1_000), Some(50)),
            StorageState::Critical
        );
    }

    #[test]
    fn missing_inode_values_do_not_create_a_warning() {
        assert_eq!(
            evaluate_storage_state(256 * GIB, 100 * GIB, false, None, None),
            StorageState::Normal
        );
        assert_eq!(
            evaluate_storage_state(256 * GIB, 100 * GIB, false, Some(0), Some(0)),
            StorageState::Normal
        );
    }

    #[test]
    fn inconsistent_inode_values_are_unknown() {
        assert_eq!(
            evaluate_storage_state(256 * GIB, 100 * GIB, false, Some(100), Some(101)),
            StorageState::Unknown
        );
    }
}
