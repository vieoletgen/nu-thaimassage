import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // การทำ Manual Chunking เพื่อแยก Library ขนาดใหญ่ (เช่น Firebase) ออกจากโค้ดหลักของเรา
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // แยก Firebase ออกเป็น Chunk พิเศษ
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            // แยก Library อื่นๆ (lucide-react, react, etc.) ออกเป็น vendor chunk
            return 'vendor';
          }
        }
      }
    },
    // ปรับขีดจำกัดการแจ้งเตือนขนาดไฟล์เป็น 1000 kB เพื่อลดความรำคาญจากคำเตือน
    chunkSizeWarningLimit: 1000,
  }
})
