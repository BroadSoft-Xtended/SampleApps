/*
 * formatter.js - some utilites for producing color coded and other fancy output
 *                to the console.
 *
 * Note that Formatter uses `chalk`'s support for auto-detecting whether or not
 * color is eanbled in the current terminal context.  You can override this logic
 * by adding the flag `--color` or `--no-color` to the command-line of the program
 * you are running.
 *
 */
__bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
var chalk = require('chalk');
var cardinal = require('cardinal');

Formatter = (function() {
  function Formatter(max,min) {
    this.max_width      = max || 80;
    this.min_width      = min || 80;
    this.current_width  = process.stdout.columns || this.min_width;
    this.current_height = process.stdout.rows || this.min_width;
    process.stdout.on('resize',this.on_resize);
    var functions = [ 'onResize', 'ntimes', 'left', 'right', 'center', 'banner', 'title', 'heading', 'subhead', 'H1', 'H2', 'H3', 'H4', 'r', 'g', 'u', 'b', 'ub', 'p','J' ];
    for(var i=0;i<functions.length;i++) {
      this[functions[i]]  = __bind(this[functions[i]],this);
    }
  }

  Formatter.prototype.on_resize = function() {
    this.current_width = process.stdout.columns;
    this.current_height = process.stdout.rows;
  }

  Formatter.prototype.banner = function(text) {
    return  chalk.blue.bold.inverse(this.center(text.toUpperCase())) + "\n";
  }

  Formatter.prototype.title = function(text) {
    var buf = ""
    buf += "\n";
    buf += chalk.blue.bold.underline(this.center(text)) + "\n";
    return buf;
  }

  Formatter.prototype.heading = function(text) {
    return chalk.blue.bold.underline(text) + "\n";
  }

  Formatter.prototype.subhead = function(text) {
    return  chalk.blue.bold(text);
  }

  Formatter.prototype.ntimes = function(n,x) {
    if(!x && (typeof n === 'string')) {
      x = n;
      n = null;
    }
    var extra = null;
    if(!n) {
      var w = Math.max(this.min_width,(Math.min(this.current_width,this.max_width)));
      var c = Math.floor(w/x.length);
      extra = x.substring(0,w-(c*x.length));
      n = c;
    }
    var buf = ""
    for(var i=0;i<n;i++) { buf += x; }
    if(extra) { buf += extra; }
    return buf;
  }

  Formatter.prototype.right = function(w,text) {
    if(!text && (typeof w === 'string')) {
      text = w;
      w = null;
    }
    if(!w) {
      w = Math.min(this.current_width,this.max_width);
    }
    var l = chalk.stripColor(text).length;
    var padding = "";
    if(l < w) {
      padding = this.ntimes(w-l,' ');
    }
    return padding+text
  }

  Formatter.prototype.left = function(w,text) {
    if(!text && (typeof w === 'string')) {
      text = w;
      w = null;
    }
    if(!w) {
      w = Math.min(this.current_width,this.max_width);
    }
    var padding = "";
    var l = chalk.stripColor(text).length;
    if(l < w) {
      padding = this.ntimes(w-l,' ');
    }
    return text+padding
  }

  Formatter.prototype.center = function(w,text) {
    if(!text && (typeof w === 'string')) {
      text = w;
      w = null;
    }
    if(!w) {
      w = Math.min(this.current_width,this.max_width);
    }
    var l = chalk.stripColor(text).length;
    var padding = "";
    if(l < w) {
      padding = this.ntimes(Math.floor((w-l)/2),' ');
    }
    var buf = padding+text;
    if(l < w) {
      buf += (this.ntimes((w-padding.length-l),' '));
    }
    return buf;
  }

  Formatter.prototype.H1 = function(text) {
    console.log(this.banner(text));
  }

  Formatter.prototype.H2 = function(text) {
    console.log(this.title(text));
  }

  Formatter.prototype.H3 = function heading(text) {
    console.log(this.heading(text));
  }

  Formatter.prototype.H4 = function(text) {
    console.log(this.subhead(text));
  }

  Formatter.prototype.r = function(text) {
    return chalk.red(text);
  }

  Formatter.prototype.g = function(text) {
    return chalk.green(text);
  }

  Formatter.prototype.u = function(text) {
    return chalk.underline(text);
  }
  Formatter.prototype.b = function(text) {
    return chalk.bold(text);
  }
  Formatter.prototype.ub = function(text) {
    return chalk.underline.bold(text);
  }

  Formatter.prototype.p = function(text) {
    if(text) {
      console.log(" "+text);
    } else {
      console.log("");
    }
  }

  Formatter.prototype.req = function(method,path,auth,body) {
    console.log(chalk.gray(" REQUEST"));
    console.log(chalk.gray("    Requesting: ") + chalk.magenta(method.toUpperCase() + " " + path));
    if(auth) {
      console.log(chalk.gray("        Header: ") + chalk.magenta("Authorization: Bearer "+auth));
    }
    if(body) {
      if(body.json) {
        console.log(chalk.gray("   Body (JSON): "+this.J(body.json)));
      } else {
        console.log(chalk.gray("   Body (Form): "+this.J(body.form)));
      }
    }
  }

  Formatter.prototype.res = function(response,body) {
    console.log(chalk.gray(" RESPONSE"));
    console.log("   "+chalk.gray("Status Code: ") + chalk.magenta(response.statusCode));
    if(response && response.headers && response.headers.location) {
      console.log("   "+chalk.gray("     Header: ") + chalk.magenta("Location: "+response.headers.location));
    }
    if(body && typeof body === 'object') {
      console.log("   "+chalk.gray("Body (JSON): "+this.J(body)));
    }
    console.log("")
  }

  Formatter.prototype.J = function(json) {
    var highlit = cardinal.highlight(JSON.stringify(json,null,2),{json:true});
    highlit = highlit.replace(/\n/g,"\n                ");
    if(!chalk.supportsColor) {
      highlit = chalk.stripColor(highlit);
    }
    return highlit;
  }

  return Formatter;
})();

module.exports = new Formatter(80);
