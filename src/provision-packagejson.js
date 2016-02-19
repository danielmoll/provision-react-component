#!/usr/bin/env node
import defaultsDeep from 'lodash.defaultsdeep';
import descriptionQuestion from 'packagesmith.questions.description';
import jsonFile from 'packagesmith.formats.json';
import kebabCase from 'lodash.kebabcase';
import moduleJson from '../package.json';
import nameQuestion from 'packagesmith.questions.name';
import parsePackageJsonName from 'parse-packagejson-name';
import { runProvisionerSet } from 'packagesmith';
import sortPackageJson from 'sort-package-json';
export function provisionPackageJson() {
  return {
    'package.json': {
      questions: [ nameQuestion(), descriptionQuestion() ],
      contents: jsonFile((packageJson, answers) => {
        const parsedPackageName = {
          ...parsePackageJsonName(answers.name || packageJson),
          scope: 'economist',
        };
        const packageName = `component-${ kebabCase(parsedPackageName.fullName.replace(/^component-/, '')) }`;
        let bugsUrl = `http://github.com/economist-components/${ packageName }/issues`;
        if (typeof packageJson.bugs === 'string') {
          bugsUrl = packageJson.bugs;
          Reflect.deleteProperty(packageJson, 'bugs');
        }
        return sortPackageJson(defaultsDeep({
          name: `@${ parsedPackageName.scope }/${ packageName }`,
          description: answers.description,
          homepage: `http://github.com/economist-components/${ packageName }`,
          bugs: { url: bugsUrl },
          config: {
            ghooks: {
              'pre-commit': 'npm run lint',
            },
          },
          scripts: {
            'prebuild:css': 'mkdir -p $npm_package_directories_lib',
            'build:css': 'cp $npm_package_directories_src/*.css $npm_package_directories_lib',
            start: 'npm run watch',
            watch: 'npm-run-all --parallel watch:*',
            'prewatch:serve': 'while [ ! -f site/index.html ]; do sleep 1; done',
            'watch:serve': 'live-server site/ --wait 500',
            prepublish: 'npm run build',
            pretest: 'npm run lint && npm run doc:js',
            lint: 'npm-run-all --parallel lint:*',
            postpublish: 'npm run access',
            access: 'npm-run-all --parallel access:*',
            'access:yld': 'npm access grant read-only economist:yld $npm_package_name',
            'access:editorial': 'npm access grant read-only economist:economist-editorial $npm_package_name',
            'access:global-logic': 'npm access grant read-only economist:global-logic $npm_package_name',
            'access:infographics': 'npm access grant read-only economist:infographics $npm_package_name',
            'access:sudo': 'npm access grant read-write economist:read-write-all $npm_package_name',
            build: 'npm-run-all --parallel build:*',
            'semantic-release': 'semantic-release pre || exit 0; npm publish && semantic-release post',
            provision: 'provision-react-component',
          },
          devDependencies: {
            '@economist/provision-react-component': moduleJson.version,
            'eslint-plugin-filenames': '^0.2.0',
            'eslint-plugin-react': '^3.11.2',
            'live-server': '^0.9.0',
          },
        }, packageJson));
      }),
    },
  };
}
export default provisionPackageJson;
if (require.main === module) {
  const directoryArgPosition = 2;
  runProvisionerSet(process.argv[directoryArgPosition] || process.cwd(), provisionPackageJson());
}
