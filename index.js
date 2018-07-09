const {PassThrough, Writable} = require('stream')


function findItem(item)
{
  return item === this
}


module.exports = class Dispatcher extends Writable
{
  constructor({inputOptions, writers = [], ...options} = {})
  {
    super({...options, objectMode: true})

    const _writers = []

    const input = new PassThrough({...inputOptions, objectMode: true})
    input.on('data', (data) =>
    {
      // Remove writer from list of writers accepting more data
      const writer = _writers.shift()

      // After writting data, the writer can accept more data, so we push it
      // back at the end of the list of writers
      if(writer.write(data))
        _writers.push(writer)

      // Writer don't accept more data, push it back when it emits the `drain`
      // event
      else
      {
        writer.once('drain', this._add)

        this._writerRemoved()
      }
    })
    input.on('drain', process.nextTick.bind(process, this.uncork.bind(this)))

    input.pause()

    this._input = input
    this._writers = _writers

    /**
     * @this writer
     */
    this._add = function()
    {
      _writers.push(this)

      input.resume()
    }

    for(const writer of writers) this.pipe(writer)
  }

  pipe(writer)
  {
    this._add.call(writer)

    return writer
  }

  unpipe(writer)
  {
    const {_writers} = this

    const index = _writers.findIndex(findItem, writer)
    if(index != null)
    {
      _writers.splice(index, 1)

      this._writerRemoved()
    }
    else
      writer.removeListener('drain', this._add)

    return this
  }

  unshift(chunk)
  {
    this._input.unshift(chunk)
  }

  _write(chunk, _, callback)
  {
    if(!this._input.write(chunk)) this.cork()

    callback()
  }

  /**
   * There are no writers accepting more data, pause the input buffer
   */
  _writerRemoved()
  {
    const {_input, _writers} = this

    if(!_writers.length) _input.pause()
  }
}
