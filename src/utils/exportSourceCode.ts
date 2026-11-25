/**
 * Zero-dependency client-side ZIP packager (PKZIP 2.0 Store format with IEEE CRC-32 & UTF-8)
 * Bundles the application's source code & configuration files on-demand via lazy Vite ?raw imports.
 * Never includes private secrets (.env) or build artifacts (node_modules, dist).
 */

const rawSourceLoaders = import.meta.glob<string>(
  [
    '/index.html',
    '/package.json',
    '/tsconfig.json',
    '/vite.config.ts',
    '/eslint.config.mjs',
    '/firestore.rules',
    '/firebase-blueprint.json',
    '/metadata.json',
    '/src/**/*.{ts,tsx,css}',
  ],
  {
    query: '?raw',
    import: 'default',
  }
);

const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

interface ZipInputEntry {
  path: string;
  content: string;
}

function buildZipArchive(entries: ZipInputEntry[]): Blob {
  const encoder = new TextEncoder();
  const { dosTime, dosDate } = getDosDateTime(new Date());

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const cleanPath = entry.path.replace(/^\/+/, '');
    const nameBytes = encoder.encode(cleanPath);
    const dataBytes = encoder.encode(entry.content);
    const checksum = crc32(dataBytes);
    const size = dataBytes.length;

    // Local File Header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed (2.0)
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Compression: Store (0)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central Directory Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 filename flag
    cv.setUint16(10, 0, true); // Compression: Store (0)
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // Extra field length
    cv.setUint16(32, 0, true); // File comment length
    cv.setUint16(34, 0, true); // Disk number start
    cv.setUint16(36, 0, true); // Internal file attributes
    cv.setUint32(38, 0, true); // External file attributes
    cv.setUint32(42, localOffset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    localOffset += localHeader.length + dataBytes.length;
  }

  let centralSize = 0;
  for (const part of centralParts) {
    centralSize += part.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, localOffset, true);
  ev.setUint16(20, 0, true);

  const allParts = [...localParts, ...centralParts, eocd];
  let totalLength = 0;
  for (const part of allParts) {
    totalLength += part.length;
  }
  const output = new Uint8Array(new ArrayBuffer(totalLength));
  let offset = 0;
  for (const part of allParts) {
    output.set(part, offset);
    offset += part.length;
  }

  return new Blob([output], {
    type: 'application/zip',
  });
}

const README_CONTENT = `# منصة النبراس التعليمية — تحت إشراف الأستاذة ليلى

نسخة الكود المصدري الكامل والجاهز للتشغيل والبناء مباشرة (React + TypeScript + Tailwind CSS + Firebase Auth & Cloud Firestore).

## خطوات التشغيل المحلي

1. تثبيت الحزم:
   \`\`\`bash
   npm install
   \`\`\`

2. إعداد ملف Firebase:
   - تم تضمين ملف \`firebase-applet-config.json\` كقالب جاهز للبناء الفوري؛ استبدل القيم داخله ببيانات مشروع Firebase الخاص بك قبل النشر (يوجد أيضاً ملف \`firebase-applet-config.example.json\` كمرجع).
   - انشر قواعد الحماية الموجودة في \`firestore.rules\` على مشروع Firebase.

3. تشغيل التطبيق:
   \`\`\`bash
   npm run dev
   \`\`\`

4. بناء النسخة النهائية للنشر:
   \`\`\`bash
   npm run build
   \`\`\`
`;

const ENV_EXAMPLE_CONTENT = `# GEMINI_API_KEY: Optional API key if Gemini features are added.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this application is hosted.
APP_URL="MY_APP_URL"
`;

const FIREBASE_CONFIG_EXAMPLE = `{
  "apiKey": "YOUR_FIREBASE_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.firebasestorage.app",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "firestoreDatabaseId": "(default)"
}
`;

let lastBlobUrl: string | null = null;

export async function downloadApplicationSourceZip(): Promise<{
  fileCount: number;
  fileName: string;
  downloadUrl: string;
}> {
  const paths = Object.keys(rawSourceLoaders).sort();

  const loadedEntries = await Promise.all(
    paths.map(async (path): Promise<ZipInputEntry | null> => {
      const loader = rawSourceLoaders[path];
      if (!loader) return null;
      try {
        const content = await loader();
        return {
          path: `al-nibras-platform/${path.replace(/^\/+/, '')}`,
          content: typeof content === 'string' ? content : String(content),
        };
      } catch {
        return null;
      }
    })
  );

  const entries: ZipInputEntry[] = loadedEntries.filter(
    (item): item is ZipInputEntry => item !== null
  );

  if (entries.length === 0) {
    throw new Error('No source files could be packaged.');
  }

  entries.push(
    {
      path: 'al-nibras-platform/README.md',
      content: README_CONTENT,
    },
    {
      path: 'al-nibras-platform/.env.example',
      content: ENV_EXAMPLE_CONTENT,
    },
    {
      path: 'al-nibras-platform/firebase-applet-config.json',
      content: FIREBASE_CONFIG_EXAMPLE,
    },
    {
      path: 'al-nibras-platform/firebase-applet-config.example.json',
      content: FIREBASE_CONFIG_EXAMPLE,
    }
  );

  const blob = buildZipArchive(entries);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `al-nibras-platform-source-${dateStamp}.zip`;

  if (lastBlobUrl) {
    URL.revokeObjectURL(lastBlobUrl);
  }
  const url = URL.createObjectURL(blob);
  lastBlobUrl = url;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  return { fileCount: entries.length, fileName, downloadUrl: url };
}
