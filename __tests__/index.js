const {PassThrough, Writable} = require('stream')

const Dispatcher = require('..')


test('Round-Robin', function(done)
{
  const a = []
  const b = []

  const dispatcher = new Dispatcher({
    writers: [
      new Writable({
        objectMode: true,
        write(chunk, encoding, callback)
        {
          a.push(chunk)
          callback()
        },
      }),
      new Writable({
        objectMode: true,
        write(chunk, encoding, callback)
        {
          b.push(chunk)
          callback()
        }
      })
    ]
  })

  dispatcher.write(1)
  dispatcher.write(2)
  dispatcher.write(3)
  dispatcher.write(4)

  dispatcher.end(function()
  {
    expect(a).toEqual([1, 3])
    expect(b).toEqual([2, 4])

    done()
  })
})

test('unshift', function(done)
{
  const dispatcher = new Dispatcher({
    writers: [
      new Writable({
        objectMode: true,
        write(chunk, encoding, callback)
        {
          expect(chunk).toEqual(1)

          done()
        },
      })
    ]
  })

  dispatcher.unshift(1)
})

test('pipe & unpipe', function()
{
  const writer = new Writable

  const dispatcher = new Dispatcher

  dispatcher.pipe(writer)

  expect(dispatcher._writers).toEqual([writer])

  dispatcher.unpipe(writer)

  expect(dispatcher._writers).toEqual([])
})

test('fill a writer buffer and `unpipe()` it', function()
{
  const writer = new PassThrough({highWaterMark: 1, objectMode: true})
  writer.pause()

  const dispatcher = new Dispatcher({writers: [writer]})

//  expect(dispatcher.write(1)).toBeTruthy()
//  expect(dispatcher.write(2)).toBeFalsy()

//  console.log(writer, dispatcher)
//  expect(writer.).toEqual()
//  expect(dispatcher._input.).toEqual()

  dispatcher.unpipe(writer)
//  console.log(dispatcher._input._readableState.buffer)

//  expect(writer.).toEqual([])
})
