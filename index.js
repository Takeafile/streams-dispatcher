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

    const inFlight = new Set
    const _writers = []

    const input = new PassThrough({...inputOptions, objectMode: true})
    .on('data', (data) =>
    {
      // Remove writer from list of writers accepting more data
      const writer = _writers.shift()

      inFlight.add(writer)

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
    .on('drain', process.nextTick.bind(process, this.uncork.bind(this)))
    .pause()

    this._input   = input
    this._writers = _writers

    /**
     * @this writer
     */
    this._add = function()
    {
      _writers.push(this)

      input.resume()
    }

    /**
     * @this writer
     */
    this._allLanded = function()
    {
      inFlight.delete(this)

      if(input._readableState.ended && !inFlight.size)
        for(const writer in _writers) writer.end()
    }

    for(const writer of writers) this.pipe(writer)
  }

  pipe(writer)
  {
    this._add.call(writer)

    // TODO emit `pipe` event?
    return writer.on('allLanded', this._allLanded)
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

    // TODO emit `unpipe` event?
    writer.removeListener('allLanded', this._allLanded)

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
