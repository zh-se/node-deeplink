var fs = require('fs')
var inliner = require('html-inline')
var stream = require('stream')

module.exports = function (options) {
  console.log('deep link module export')
  options = options || {}
  if (!options.fallback) { throw new Error('Error (deeplink): options.fallback cannot be null') }
  options.android_package_name = options.android_package_name || ''
  options.ios_store_link = options.ios_store_link || ''
  options.title = options.title || ''

  var deeplink = function (req, res, next) {
    var opts = {}
    Object.keys(options).forEach(function (k) { opts[k] = options[k] })

    console.log('deep link options: '+ JSON.stringify(opts))
    // bail out if we didn't get url
    if (!req.query.url) {
      return next()
    }
    opts.url = req.query.url

    if (req.query.fallback) {
      console.log('deeplink fallback url: ' + opts.url)
      var splitSeq = '://' // split path in the app
      var components = opts.url.split(splitSeq)
      opts.fallback = req.query.fallback + components[1]
    }

    // read template file
    var file = fs.createReadStream(__dirname + '/public/index.html')

    // replace all template tokens with values from options
    var detoken = new stream.Transform({ objectMode: true })
    detoken._transform = function (chunk, encoding, done) {
      var data = chunk.toString()
      Object.keys(opts).forEach(function (key) {
        data = data.replace('{{' + key + '}}', opts[key])
      })

      this.push(data)
      done()
    }

    // inline template js with html
    var inline = inliner({ basedir: __dirname + '/public' })

    // make sure the page is being sent as html
    res.set('Content-Type', 'text/html;charset=utf-8')

    // read file --> detokenize --> inline js --> send out
    file.pipe(detoken).pipe(inline).pipe(res)
  }

  return deeplink
}
