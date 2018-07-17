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

    const uncork = process.nextTick.bind(process, this.uncork.bind(this))

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
    .on('end', function()
    {
      for(const writer of _writers) writer.end()
    })
    .on('drain', uncork)
    .pause()

    function onFinish()
    {
      if(!inFlight.size) input.end()
    }

    this
    .on('finish', onFinish)
    .cork()

    this._input   = input
    this._writers = _writers

    /**
     * @this writer
     */
    this._add = function()
    {
      _writers.push(this)

      input.resume()
      uncork()
    }

    const {_writableState} = this

    /**
     * @this writer
     */
    this._allLanded = function()
    {
      inFlight.delete(this)

      if(_writableState.finished) onFinish()
    }

    for(const writer of writers) this.pipe(writer)
  }

  pipe(writer)
  {
    this._add.call(writer)

    return writer
    .on('allLanded', this._allLanded)
    .emit('pipe', this)
  }

  unpipe(writer)
  {
    const {_writers} = this

    const index = _writers.findIndex(findItem, writer)
    if(index != null)
      _writers.splice(index, 1)
    else
      writer.removeListener('drain', this._add)

    this._writerRemoved()

    writer
    .removeListener('allLanded', this._allLanded)
    .emit('unpipe', this)

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

    if(!_writers.length)
    {
      _input.pause()
      this.cork()
    }
  }
}
