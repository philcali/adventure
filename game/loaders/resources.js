const loaderUtils = require('loader-utils');
const path = require('path');
const glob = require('fast-glob');

module.exports = function(content, map, meta) {
  const options = loaderUtils.getOptions(this);
  const data = JSON.parse(content);
  const resources = [];
  const audio = {};
  data.files.forEach(file => {
    file.src.forEach(src => {
      glob.sync(src, { cwd: options.root }).forEach(res => {
        let name = path.basename(res, path.extname(res));
        let absolutePath = path.join(options.root, res);
        if (file.type !== 'audio' || !audio[name]) {
          if (file.type === 'audio') {
            audio[name] = true;
          }
          resources.push({
            name,
            type: file.type,
            src: file.type === 'audio' ? path.dirname(res) + '/' : res
          });
          // Adds to update watcher
          this.addDependency(absolutePath);
          // Emits to public dir
          this.emitFile(res, this.fs.readFileSync(absolutePath));
        }
      });
    });
  });
  return JSON.stringify(resources);
};
