# -*- coding: utf-8 -*-
"""
Arşiv 360 - Kalıcı SQLite İndeks Yöneticisi (SQLite Index Database Manager)
WAL Modu, Mikro-Batch Transaction Yönetimi, Sayfalı Arama ve Güvenli Kapanış.
"""

import sqlite3
import time
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from .volume_utils import VolumeInfo


class IndexDatabase:
    """
    Milyonlarca dosya kaydını kasmadan yönetmek üzere tasarlanmış
    tek-yazıcılı (single-writer) SQLite indeks yöneticisi.
    """

    def __init__(self, db_path: str = "arsiv_index.db"):
        self.db_path = ":memory:" if db_path == ":memory:" else str(Path(db_path).resolve())
        self._conn: Optional[sqlite3.Connection] = None
        self._init_connection()
        self._create_schema()

    def _init_connection(self):
        """SQLite bağlantısını yüksek performanslı WAL ve önbellek parametreleriyle açar."""
        self._conn = sqlite3.connect(
            self.db_path,
            timeout=30.0,
            isolation_level=None  # Manuel transaction yönetimi için
        )
        self._conn.row_factory = sqlite3.Row
        cursor = self._conn.cursor()
        
        # Yüksek Performans Parametreleri
        cursor.execute("PRAGMA journal_mode = WAL;")
        cursor.execute("PRAGMA synchronous = NORMAL;")
        cursor.execute("PRAGMA temp_store = MEMORY;")
        cursor.execute("PRAGMA cache_size = -64000;")  # 64 MB RAM Önbelleği
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.close()

    def _create_schema(self):
        """Tabloları ve arama indekslerini oluşturur."""
        cursor = self._conn.cursor()
        cursor.execute("BEGIN IMMEDIATE TRANSACTION;")
        try:
            # 1. Birimler (Volumes)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS volumes (
                volume_guid TEXT PRIMARY KEY,
                serial_number INTEGER,
                serial_hex TEXT,
                current_drive_letter TEXT NOT NULL,
                label TEXT,
                filesystem TEXT NOT NULL,
                is_system_volume BOOLEAN DEFAULT 0,
                total_bytes INTEGER,
                free_bytes INTEGER,
                last_indexed_at INTEGER
            );
            """)

            # 2. Dosyalar (Files)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER DEFAULT 0,
                volume_guid TEXT NOT NULL REFERENCES volumes(volume_guid) ON DELETE CASCADE,
                parent_dir TEXT NOT NULL,
                filename TEXT NOT NULL,
                path TEXT NOT NULL,
                extension TEXT,
                size_bytes INTEGER NOT NULL,
                mtime_ns INTEGER NOT NULL,
                attributes INTEGER DEFAULT 0,
                protection_level INTEGER DEFAULT 0,
                protection_reason TEXT,
                quick_hash TEXT,
                full_sha256 TEXT,
                hash_updated_at INTEGER,
                UNIQUE(volume_guid, path)
            );
            """)

            # Performans İndeksleri
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_vol_file_id ON files(volume_guid, file_id) WHERE file_id != 0;")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_parent ON files(parent_dir);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_size ON files(size_bytes);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_ext ON files(extension);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_prot ON files(protection_level);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_files_cand ON files(size_bytes, quick_hash) WHERE quick_hash IS NOT NULL;")

            cursor.execute("COMMIT;")
        except Exception:
            cursor.execute("ROLLBACK;")
            raise
        finally:
            cursor.close()

    def save_volume(self, vol: VolumeInfo) -> None:
        """Sürücü / Birim kaydını günceller veya ekler."""
        cursor = self._conn.cursor()
        cursor.execute("""
        INSERT INTO volumes (
            volume_guid, serial_number, serial_hex, current_drive_letter,
            label, filesystem, is_system_volume, total_bytes, free_bytes, last_indexed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(volume_guid) DO UPDATE SET
            current_drive_letter = excluded.current_drive_letter,
            label = excluded.label,
            total_bytes = excluded.total_bytes,
            free_bytes = excluded.free_bytes,
            last_indexed_at = excluded.last_indexed_at;
        """, (
            vol.guid,
            vol.serial_number,
            vol.serial_hex,
            vol.drive_letter,
            vol.label,
            vol.filesystem,
            1 if vol.is_system_volume else 0,
            vol.total_bytes,
            vol.free_bytes,
            int(time.time() * 1000)
        ))
        cursor.close()

    def insert_files_batch(self, file_tuples: List[Tuple]) -> int:
        """
        Toplu dosya kayıtlarını tek transaction içinde ekler/günceller.
        file_tuples eleman formatı:
        (file_id, volume_guid, parent_dir, filename, path, extension, size_bytes, mtime_ns, attributes, protection_level, protection_reason)
        """
        if not file_tuples:
            return 0

        cursor = self._conn.cursor()
        cursor.execute("BEGIN IMMEDIATE TRANSACTION;")
        try:
            cursor.executemany("""
            INSERT INTO files (
                file_id, volume_guid, parent_dir, filename, path,
                extension, size_bytes, mtime_ns, attributes,
                protection_level, protection_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(volume_guid, path) DO UPDATE SET
                file_id = excluded.file_id,
                parent_dir = excluded.parent_dir,
                filename = excluded.filename,
                extension = excluded.extension,
                size_bytes = excluded.size_bytes,
                mtime_ns = excluded.mtime_ns,
                attributes = excluded.attributes,
                protection_level = excluded.protection_level,
                protection_reason = excluded.protection_reason;
            """, file_tuples)
            cursor.execute("COMMIT;")
            return len(file_tuples)
        except Exception:
            cursor.execute("ROLLBACK;")
            raise
        finally:
            cursor.close()

    def query_files(
        self,
        volume_guid: Optional[str] = None,
        search_query: Optional[str] = None,
        extension: Optional[str] = None,
        protection_level: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Sanal liste (Virtual scroll) için hızlı, sayfalanmış dosya araması.
        """
        conditions = []
        params = []

        if volume_guid:
            conditions.append("volume_guid = ?")
            params.append(volume_guid)

        if search_query:
            conditions.append("(filename LIKE ? OR path LIKE ?)")
            q = f"%{search_query}%"
            params.extend([q, q])

        if extension:
            ext = extension.lower() if extension.startswith(".") else f".{extension.lower()}"
            conditions.append("extension = ?")
            params.append(ext)

        if protection_level is not None:
            conditions.append("protection_level = ?")
            params.append(protection_level)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"""
        SELECT file_id, volume_guid, parent_dir, filename, path,
               extension, size_bytes, mtime_ns, protection_level, protection_reason
        FROM files
        {where_clause}
        ORDER BY size_bytes DESC
        LIMIT ? OFFSET ?;
        """
        params.extend([limit, offset])

        cursor = self._conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        cursor.close()

        return [dict(row) for row in rows]

    def get_stats(self) -> Dict[str, Any]:
        """Veritabanındaki genel istatistikleri döndürür."""
        cursor = self._conn.cursor()
        cursor.execute("SELECT COUNT(*), COALESCE(SUM(size_bytes), 0) FROM files;")
        total_files, total_bytes = cursor.fetchone()

        cursor.execute("SELECT protection_level, COUNT(*) FROM files GROUP BY protection_level;")
        prot_counts = {r[0]: r[1] for r in cursor.fetchall()}

        cursor.execute("SELECT COUNT(*) FROM volumes;")
        total_vols = cursor.fetchone()[0]
        cursor.close()

        return {
            "total_files": total_files,
            "total_bytes": total_bytes,
            "total_volumes": total_vols,
            "protection_levels": {
                "user_data": prot_counts.get(0, 0),
                "app_system_data": prot_counts.get(1, 0),
                "critical_system": prot_counts.get(2, 0),
            }
        }

    def close(self):
        """Veritabanını güvenle kapatır ve checkpoint yapar."""
        if self._conn:
            try:
                self._conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
                self._conn.close()
            except Exception:
                pass
            finally:
                self._conn = None
