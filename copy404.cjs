const fs = require('fs')
const path = require('path')

const fileContent = fs.readFileSync(path.join('dist', 'index.html'))
fs.writeFileSync(path.join('dist', '404.html'), fileContent)