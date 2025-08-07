import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'

const jopiReplaceServerPlugin = (): Plugin => {
  return {
    name: 'jopi-replace-server',
    transform(code, id) {
      if (/\.(ts|js|tsx|jsx)$/.test(id)) {
        const newCode = code.replace(
            "jopi-node-space-server",
            "jopi-node-space-browser"
        );

        if (newCode !== code) {
          return {code: newCode, map: null};
        }
      }

      // Return null allow keeping the code unchanged.

      return null;
    }
  };
};

export default defineConfig({
  plugins: [react(), jopiReplaceServerPlugin()],
  build: { rollupOptions: { external: ['node:module', 'jopi-node-space-server'] } },
  ssr: { noExternal: ['node:module', 'jopi-node-space-server'] },
});

