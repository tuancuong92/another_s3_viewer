import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import solidPlugin from 'eslint-plugin-solid';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.cjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      solid: solidPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...Object.fromEntries(
          Object.entries({
            window: 'readonly',
            document: 'readonly',
            console: 'readonly',
            setTimeout: 'readonly',
            setInterval: 'readonly',
            clearTimeout: 'readonly',
            clearInterval: 'readonly',
            process: 'readonly',
            Buffer: 'readonly',
            __dirname: 'readonly',
            __filename: 'readonly',
            module: 'readonly',
            require: 'readonly',
            exports: 'readonly',
          })
        ),
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
      'import/order': 'off',
      // SolidJS rules from plugin's typescript config
      'solid/components-return-once': 'error',
      'solid/no-destructure': 'warn',
      'solid/no-innerhtml': 'warn',
      'solid/no-react-specific-props': 'error',
      'solid/no-unknown-namespaces': 'error',
      'solid/prefer-for': 'warn',
      'solid/prefer-show': 'warn',
      'solid/reactivity': 'warn',
      'solid/self-closing-comp': 'error',
    },
  },
];
