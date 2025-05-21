import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
    plugins: [vue(),tailwindcss(),],
    server: {
        host: '0.0.0.0', // 监听所有地址
        port: 3000, // 指定启动端口
        allowedHosts:[
            "q99c3892.natappfree.cc"
        ]
    }
})