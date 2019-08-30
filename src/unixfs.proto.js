'use strict'

module.exports = `message Data {
  enum DataType {
    Raw = 0;
    Directory = 1;
    File = 2;
    Metadata = 3;
    Symlink = 4;
    HAMTShard = 5;
  }

  required DataType Type = 1;
  optional bytes Data = 2;
  optional uint64 filesize = 3;
  repeated uint64 blocksizes = 4;

  optional uint64 hashType = 5;
  optional uint64 fanout = 6;

  optional uint32 mtime = 7;
  optional uint32 atime = 8;
  optional uint32 ctime = 9;

  optional uint32 permissions = 10;
  optional uint32 uid = 11;
  optional uint32 gid = 12;
}

message Metadata {
  optional string MimeType = 1;
}`
