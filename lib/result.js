function Result(file, severity, line, col, code, msg) {
  this.severity = severity;
  this.file = file;
  this.line = line;
  this.col = col;
  this.code = code;
  this.msg = msg;
}

module.exports = Result;