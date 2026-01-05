// Single Page Apps for GitHub Pages
// https://github.com/rafgraph/spa-github-pages
(function() {
  var pathSegmentsToKeep = 1;
  var l = window.location;
  var pathname = l.pathname;
  
  // Only redirect if we're not already on the correct path
  if (pathname.indexOf('/?/') === -1) {
    var repoName = pathname.split('/')[1];
    var basePath = repoName ? '/' + repoName + '/' : '/';
    
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      basePath + '?/' +
      pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  }
})();

