[![Build Status](https://travis-ci.org/Takeafile/streams-dispatcher.svg?branch=master)](https://travis-ci.org/Takeafile/streams-dispatcher)
[![Coverage Status](https://coveralls.io/repos/github/Takeafile/streams-dispatcher/badge.svg?branch=master)](https://coveralls.io/github/Takeafile/streams-dispatcher?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/Takeafile/streams-dispatcher.svg)](https://greenkeeper.io/)

# streams-dispatcher

Distribute data chunks from a stream to other streams

With Node.js `Readable` streams, you can be able to pipe them to several
destination streams, receiving all of them a copy of the same data. This module
allows instead to send each data chunk to a diferent destination stream each
time in a Round-Robin way.

## Install

```sh
npm install streams-dispatcher
```

## API

- *options*: options passed to the underlaying `Writable` stream
  - *inputOptions*: options passed to the internal `input` stream
  - *writers*: list of `Writable` streams where to distribute the data chunks

## TODO

Move management of in-flight data chunks to its own independent module
