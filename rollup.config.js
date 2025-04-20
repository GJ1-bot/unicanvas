import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

// 可选：如果需要 Babel 支持
// import babel from '@rollup/plugin-babel';

export default [
  // UMD 构建 (适用于浏览器)
  {
    input: 'src/index.js',
    output: {
      name: 'UniCanvas',
      file: pkg.main,
      format: 'umd',
      exports: 'named',
      sourcemap: true
    },
    plugins: [
      resolve(), // 解析 node_modules 中的模块
      commonjs(), // 将 CommonJS 模块转换为 ES6
      // 可选：如果需要 Babel 支持
      // babel({
      //   babelHelpers: 'bundled',
      //   exclude: 'node_modules/**',
      //   presets: [['@babel/preset-env', { targets: '> 0.25%, not dead' }]]
      // }),
      terser() // 压缩代码
    ]
  },
  
  // ESM 构建 (适用于现代打包工具)
  {
    input: 'src/index.js',
    output: {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      // 可选：如果需要 Babel 支持
      // babel({
      //   babelHelpers: 'bundled',
      //   exclude: 'node_modules/**',
      //   presets: [['@babel/preset-env', { targets: '> 0.25%, not dead' }]]
      // }),
      terser()
    ]
  }
];
