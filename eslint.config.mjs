import js from '@eslint/js'
import tseslint from 'typescript-eslint'

const tsFiles = ['src/**/*.ts', 'tests/**/*.ts', 'vitest.config.ts']

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'infrastructure/**', '**/*.js']
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: tsFiles
  })),
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false
          }
        }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports'
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  }
)
