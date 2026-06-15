module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.(html|svg)$",
      },
    ],
  },
  moduleFileExtensions: ["ts", "html", "js", "json", "mjs"],
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^uuid$": "<rootDir>/src/test/uuid.mock.ts",
  },
  collectCoverageFrom: [
    "src/app/**/*.ts",
    "!src/app/**/*.module.ts",
    "!src/app/**/*.config.ts",
    "!src/app/app.config.ts",
    "!src/main.ts",
    "!src/app/auth/msal.config.ts",
    "!src/app/auth/msal.factories.ts",
    "!src/app/auth/redirect-handler.component.ts",
    "!src/environments/**",
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  coverageReporters: ["html", "lcov", "text-summary"],
};
