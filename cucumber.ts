module.exports = {
  default: {
    require: ['features/steps/**/*.ts'],
    format: ['progress', 'html:reports/cucumber-report.html'],
    paths: ['features/**/*.feature'],
    publishQuiet: true,
    requireModule: ['ts-node/register'],
  },
}
