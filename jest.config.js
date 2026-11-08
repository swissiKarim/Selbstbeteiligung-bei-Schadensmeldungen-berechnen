/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: ".agentsphere/reports",
        outputName: "junit.xml",
        classNameTemplate: "{filepath}",
        titleTemplate: "{title}",
        ancestorSeparator: " › ",
        addFileAttribute: "true",
      },
    ],
  ],
};
