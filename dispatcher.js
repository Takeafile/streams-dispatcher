const {Writable} = require('stream')


function findItem(item)
{
  return item === this
}


module.exports = class Dispatcher extends Writable
{
  constructor({writers = [], ...options})
  {
    super({...options, objectMode: true})

    this._writers = []

    this.cork()

    for(const writer of writers) this.pipe(writer)
  }

  pipe(writer)
  {
    this._add(writer)

    writer._onDrain = () => this._add(writer)

    return writer
  }

  unpipe(writer)
  {
    const {_writers} = this

    const index = _writers.findIndex(findItem, writer)
    if(index)
    {
      this.cork()

      _writers.splice(index, 1)
    }
    else
      writer.removeListener('drain', writer._onDrain)

    delete writer._onDrain

    return this
  }

  _add(writer)
  {
    this._writers.push(writer)

    process.nextTick(() => this.uncork())
  }

  _write(chunk, _, callback)
  {
    const {_writers} = this

    const writer = _writers.shift()

    if(writer.write(chunk))
      _writers.push(writer)
    else
    {
      this.cork()

      writer.once('drain', writer._onDrain)
    }

    callback()
  }
}
