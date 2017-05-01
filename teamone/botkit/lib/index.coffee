fs      = require 'fs'
path    = require 'path'
HOMEDIR = path.join(__dirname,'..')
LIB_COV = path.join(HOMEDIR,'lib-cov')
LIB_DIR = if fs.existsSync(LIB_COV) then LIB_COV else path.join(HOMEDIR,'lib')

for file in ["team-one-bot"]
  obj = require(path.join(LIB_DIR,file))
  for n,v of obj
    exports[n] = v
