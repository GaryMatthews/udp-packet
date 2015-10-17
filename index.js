exports.encode = function (packet) {
  var data = packet.data, len = data.length
  var srcport = packet.sourcePort, srcip = packet.sourceIp
  var dstport = packet.destinationPort, dstip = packet.destinationIp
  var buf = new Buffer(len + 8)
  buf.writeUInt16BE(srcport, 0)
  buf.writeUInt16BE(dstport, 2)
  buf.writeUInt16BE(buf.length, 4)
  var protocol = packet.protocol === undefined ? 0x11 : packet.protocol
  var checksum = 0xffff
  // pseudo header: srcip (16), dstip (16), 0 (8), proto (8), udp len (16)
  if (srcip && dstip) {
    if (typeof srcip === 'string') srcip = Buffer(srcip.split('.'))
    if (typeof dstip === 'string') dstip = Buffer(dstip.split('.'))
    checksum = 0
    var pad = len % 2
    for (var i = 0; i < len + pad; i += 2) {
      checksum += ((data[i]<<8)&0xff00) + ((data[i+1])&0xff)
    }
    for (var i = 0; i < 4; i += 2) {
      checksum += ((dstip[i]<<8)&0xff00) + (dstip[i+1]&0xff)
    }
    checksum += protocol + len
    while (checksum>>16) {
      checksum = (checksum & 0xffff) + (checksum >> 16)
    }
    checksum = 0xffff ^ checksum
  }
  buf.writeUInt16BE(checksum, 6)
  packet.data.copy(buf, 8)
  return buf
}

exports.decode = function (buf) {
}
