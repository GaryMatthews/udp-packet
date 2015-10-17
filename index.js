exports.encode = function (packet) {
  var data = packet.data, len = data.length
  var srcport = packet.sourcePort, dstport = packet.destinationPort
  var buf = new Buffer(len + 8)
  buf.writeUInt16BE(srcport, 0)
  buf.writeUInt16BE(dstport, 2)
  buf.writeUInt16BE(buf.length, 4)
  var protocol = packet.protocol === undefined ? 0x11 : packet.protocol
  buf.writeUInt16BE(checksum(packet), 6)
  packet.data.copy(buf, 8)
  return buf
}

exports.decode = function (buf) {
  var len = buf.readUInt16BE(4)
  return {
    sourcePort: buf.readUInt16BE(0),
    destinationPort: buf.readUInt16BE(2),
    length: len,
    checksum: buf.readUInt16BE(6),
    data: buf.slice(8, len)
  }
}

exports.checksum = checksum
function checksum (packet) {
  // pseudo header: srcip (16), dstip (16), 0 (8), proto (8), udp len (16)
  var data = packet.data, len = data.length
  var srcport = packet.sourcePort, srcip = packet.sourceIp
  var dstport = packet.destinationPort, dstip = packet.destinationIp
  if (!srcip || !dstip) return 0xffff
  var protocol = packet.protocol === undefined ? 0x11 : packet.protocol
  var sum = 0xffff
  // pseudo header: srcip (16), dstip (16), 0 (8), proto (8), udp len (16)
  if (srcip && dstip) {
    if (typeof srcip === 'string') srcip = Buffer(srcip.split('.'))
    if (typeof dstip === 'string') dstip = Buffer(dstip.split('.'))
    sum = 0
    var pad = len % 2
    for (var i = 0; i < len + pad; i += 2) {
      sum += ((data[i]<<8)&0xff00) + ((data[i+1])&0xff)
    }
    for (var i = 0; i < 4; i += 2) {
      sum += ((dstip[i]<<8)&0xff00) + (dstip[i+1]&0xff)
    }
    sum += protocol + len
    while (sum>>16) {
      sum = (sum & 0xffff) + (sum >> 16)
    }
    sum = 0xffff ^ sum
  }
  return sum
}
