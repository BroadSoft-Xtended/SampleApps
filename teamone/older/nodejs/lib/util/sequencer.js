/*
 * sequencer.js - a cleaner way to write deeply-nested callback methods.
 *
 * Node.js uses "callback methods" whenever an asychronous service such as
 * I/O is used.  This can lead to deeply nested and hard-to-read code
 * such as;
 *
 *     methodOne(1,2,function() {
 *       methodTwo('foo',function() {
 *          methodThree('bar',function() {
 *            // ...etc...
 *          });
 *       })'
 *     });
 *
 * Sequencer gives us a way to "flatten out" those nested calls.
 *
 * It works like this:
 *
 *     S = new Sequencer();
 *     S.first(function(next) {
 *       methodOne(1,2,next);
 *     });
 *     S.next(function(next) {
 *       methodTwo('foo',function(){next()});
 *     });
 *     S.next(function(next) {
 *       methodThree('bar',next);
 *     });
 *     S.run();
 *
 * Calling `run` will invoke each of those methods in turn.
 * You MUST ensure that `next()` is called after each
 * step in the process so that Sequencer knows to move on
 * to the next step.
 */

__bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Sequencer = (function() {
  function Sequencer() {
    this.list  = [];
    this.first = __bind(this.first, this);
    this.next  = __bind(this.next, this);
    this.run   = __bind(this.run, this);
  }
  Sequencer.prototype.first = function(step) {
    this.list = [];
    this.list.push(step);
    return this;
  };
  Sequencer.prototype.next = function(step) {
    this.list.push(step);
    return this;
  };
  Sequencer.prototype.run = function(action) {
    var index = 0;
    var self = this;
    var looper = function() {
      if(index < self.list.length) {
        self.list[index](function(){
          index++;
          looper();
        });
      } else if(action) {
        action();
      }
    };
    looper();
    return this;
  };
  return Sequencer;
})();

module.exports = Sequencer;
