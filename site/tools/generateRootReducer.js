/* eslint-disable no-console */
import _ from 'lodash';
import dir from 'node-dir';
import fs from 'fs';
import path from 'path';

dir.subdirs(path.resolve(__dirname, '../app/features'), (err1, directoryPaths) => {
  if (err1) throw err1;

  const features = _.reduce(directoryPaths, (result, directoryPath) => {
    const matches = directoryPath.match(/features(?:\/|\\)(.+?)(?:\/|\\)reducers$/);
    if (!matches) return result;

    return [...result, {path: matches[1], name: matches[1].replace(/\/|\\/, '_'), subFeatures: matches[1].split(/\/|\\/)}];
  }, []);

  _.sortBy(features, f => f.name);

  const buildReducersJs = ({name, subFeatures}) => {
    if (subFeatures.length === 1) return [`${subFeatures[0]}: ${name},`];
    return [
      `${subFeatures[0]}: combineReducers({`,
      ..._.flatMap(buildReducersJs({name, subFeatures: subFeatures.splice(1)}), l => `  ${l}`),
      '}),',
    ];
  };

  const featuresJs = features.length === 0 ? [] : [
    '  features: combineReducers({',
    ..._.flatMap(features, buildReducersJs).map(l => `    ${l}`),
    '  }),',
  ];

  const rootReducerContents = [
    '/* eslint-disable sort-imports */',
    '/* eslint-disable camelcase */',
    '/* eslint-disable object-shorthand */',
    'import {combineReducers} from \'redux\';',
    'import {routerReducer} from \'react-router-redux\';',
    ...features.map(feature => `import ${feature.name} from './features/${feature.path}/reducers';`),

    '\nconst rootReducer = combineReducers({',
    ...featuresJs,
    '  router: routerReducer,',
    '});\n',

    'export default rootReducer;\n',
  ].join('\n');

  fs.writeFile(path.resolve(__dirname, '../app/rootReducer.js'), rootReducerContents, err2 => {
    if (err2) throw err2;
  });
});

