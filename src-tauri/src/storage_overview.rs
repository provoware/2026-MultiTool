use serde::Serialize;
use std::{collections::HashSet, path::Path};

#[derive(Debug, Serialize)]
pub struct StorageVolume {
    name: String,
    mount_point: String,
    total_bytes: u64,
    free_bytes: u64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct MountEntry {
    mount_point: String,
    fs_type: String,
    source: String,
}

fn decode_mount_field(value: &str) -> String {
    value
        .replace("\\040", " ")
        .replace("\\011", "\t")
        .replace("\\012", "\n")
        .replace("\\134", "\\")
}

fn parse_mountinfo_line(line: &str) -> Option<MountEntry> {
    let (left, right) = line.split_once(" - ")?;
    let left_fields: Vec<_> = left.split_whitespace().collect();
    let right_fields: Vec<_> = right.split_whitespace().collect();
    if left_fields.len() < 5 || right_fields.len() < 2 {
        return None;
    }

    Some(MountEntry {
        mount_point: decode_mount_field(left_fields[4]),
        fs_type: right_fields[0].to_string(),
        source: decode_mount_field(right_fields[1]),
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

#[cfg(target_os = "linux")]
fn filesystem_space(mount_point: &str) -> Result<(u64, u64), String> {
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

    Ok((
        total.min(u64::MAX as u128) as u64,
        free.min(u64::MAX as u128) as u64,
    ))
}

#[cfg(not(target_os = "linux"))]
fn filesystem_space(_mount_point: &str) -> Result<(u64, u64), String> {
    Err("Speicherübersicht ist in diesem Stand nur für Linux freigegeben".to_string())
}

#[cfg(target_os = "linux")]
pub fn list_storage_volumes() -> Result<Vec<StorageVolume>, String> {
    let mountinfo = std::fs::read_to_string("/proc/self/mountinfo")
        .map_err(|error| format!("Eingehängte Datenträger konnten nicht gelesen werden: {error}"))?;

    let volumes: Vec<_> = selected_mounts(&mountinfo)
        .into_iter()
        .filter_map(|entry| {
            let (total_bytes, free_bytes) = filesystem_space(&entry.mount_point).ok()?;
            (total_bytes > 0).then(|| StorageVolume {
                name: display_name(&entry),
                mount_point: entry.mount_point,
                total_bytes,
                free_bytes: free_bytes.min(total_bytes),
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
55 36 7:0 / /tmp/.mount_app rw,relatime - squashfs /dev/loop0 ro";

    #[test]
    fn parser_decodes_mount_names_and_filters_non_storage_mounts() {
        let mounts = selected_mounts(SAMPLE);
        assert_eq!(mounts.len(), 2);
        assert_eq!(mounts[0].mount_point, "/");
        assert_eq!(mounts[1].mount_point, "/media/test/Meine Daten");
        assert_eq!(mounts[1].source, "/dev/sdb1");
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
}
