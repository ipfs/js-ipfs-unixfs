/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.Data = (function() {

    /**
     * Properties of a Data.
     * @exports IData
     * @interface IData
     * @property {Data.DataType} Type Data Type
     * @property {Uint8Array} [Data] Data Data
     * @property {number|Long} [filesize] Data filesize
     * @property {Array.<number|Long>} [blocksizes] Data blocksizes
     * @property {number|Long} [hashType] Data hashType
     * @property {number|Long} [fanout] Data fanout
     */

    /**
     * Constructs a new Data.
     * @exports Data
     * @classdesc Represents a Data.
     * @constructor
     * @param {IData=} [properties] Properties to set
     */
    function Data(properties) {
        this.blocksizes = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Data Type.
     * @member {Data.DataType}Type
     * @memberof Data
     * @instance
     */
    Data.prototype.Type = 0;

    /**
     * Data Data.
     * @member {Uint8Array}Data
     * @memberof Data
     * @instance
     */
    Data.prototype.Data = $util.newBuffer([]);

    /**
     * Data filesize.
     * @member {number|Long}filesize
     * @memberof Data
     * @instance
     */
    Data.prototype.filesize = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * Data blocksizes.
     * @member {Array.<number|Long>}blocksizes
     * @memberof Data
     * @instance
     */
    Data.prototype.blocksizes = $util.emptyArray;

    /**
     * Data hashType.
     * @member {number|Long}hashType
     * @memberof Data
     * @instance
     */
    Data.prototype.hashType = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * Data fanout.
     * @member {number|Long}fanout
     * @memberof Data
     * @instance
     */
    Data.prototype.fanout = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * Creates a new Data instance using the specified properties.
     * @function create
     * @memberof Data
     * @static
     * @param {IData=} [properties] Properties to set
     * @returns {Data} Data instance
     */
    Data.create = function create(properties) {
        return new Data(properties);
    };

    /**
     * Encodes the specified Data message. Does not implicitly {@link Data.verify|verify} messages.
     * @function encode
     * @memberof Data
     * @static
     * @param {IData} message Data message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Data.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        writer.uint32(/* id 1, wireType 0 =*/8).int32(message.Type);
        if (message.Data != null && message.hasOwnProperty("Data"))
            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.Data);
        if (message.filesize != null && message.hasOwnProperty("filesize"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.filesize);
        if (message.blocksizes != null && message.blocksizes.length)
            for (var i = 0; i < message.blocksizes.length; ++i)
                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.blocksizes[i]);
        if (message.hashType != null && message.hasOwnProperty("hashType"))
            writer.uint32(/* id 5, wireType 0 =*/40).uint64(message.hashType);
        if (message.fanout != null && message.hasOwnProperty("fanout"))
            writer.uint32(/* id 6, wireType 0 =*/48).uint64(message.fanout);
        return writer;
    };

    /**
     * Encodes the specified Data message, length delimited. Does not implicitly {@link Data.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Data
     * @static
     * @param {IData} message Data message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Data.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Data message from the specified reader or buffer.
     * @function decode
     * @memberof Data
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Data} Data
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Data.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Data();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.Type = reader.int32();
                break;
            case 2:
                message.Data = reader.bytes();
                break;
            case 3:
                message.filesize = reader.uint64();
                break;
            case 4:
                if (!(message.blocksizes && message.blocksizes.length))
                    message.blocksizes = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.blocksizes.push(reader.uint64());
                } else
                    message.blocksizes.push(reader.uint64());
                break;
            case 5:
                message.hashType = reader.uint64();
                break;
            case 6:
                message.fanout = reader.uint64();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        if (!message.hasOwnProperty("Type"))
            throw $util.ProtocolError("missing required 'Type'", { instance: message });
        return message;
    };

    /**
     * Decodes a Data message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Data
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Data} Data
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Data.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Data message.
     * @function verify
     * @memberof Data
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Data.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        switch (message.Type) {
        default:
            return "Type: enum value expected";
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            break;
        }
        if (message.Data != null && message.hasOwnProperty("Data"))
            if (!(message.Data && typeof message.Data.length === "number" || $util.isString(message.Data)))
                return "Data: buffer expected";
        if (message.filesize != null && message.hasOwnProperty("filesize"))
            if (!$util.isInteger(message.filesize) && !(message.filesize && $util.isInteger(message.filesize.low) && $util.isInteger(message.filesize.high)))
                return "filesize: integer|Long expected";
        if (message.blocksizes != null && message.hasOwnProperty("blocksizes")) {
            if (!Array.isArray(message.blocksizes))
                return "blocksizes: array expected";
            for (var i = 0; i < message.blocksizes.length; ++i)
                if (!$util.isInteger(message.blocksizes[i]) && !(message.blocksizes[i] && $util.isInteger(message.blocksizes[i].low) && $util.isInteger(message.blocksizes[i].high)))
                    return "blocksizes: integer|Long[] expected";
        }
        if (message.hashType != null && message.hasOwnProperty("hashType"))
            if (!$util.isInteger(message.hashType) && !(message.hashType && $util.isInteger(message.hashType.low) && $util.isInteger(message.hashType.high)))
                return "hashType: integer|Long expected";
        if (message.fanout != null && message.hasOwnProperty("fanout"))
            if (!$util.isInteger(message.fanout) && !(message.fanout && $util.isInteger(message.fanout.low) && $util.isInteger(message.fanout.high)))
                return "fanout: integer|Long expected";
        return null;
    };

    /**
     * Creates a Data message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Data
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Data} Data
     */
    Data.fromObject = function fromObject(object) {
        if (object instanceof $root.Data)
            return object;
        var message = new $root.Data();
        switch (object.Type) {
        case "Raw":
        case 0:
            message.Type = 0;
            break;
        case "Directory":
        case 1:
            message.Type = 1;
            break;
        case "File":
        case 2:
            message.Type = 2;
            break;
        case "Metadata":
        case 3:
            message.Type = 3;
            break;
        case "Symlink":
        case 4:
            message.Type = 4;
            break;
        case "HAMTShard":
        case 5:
            message.Type = 5;
            break;
        }
        if (object.Data != null)
            if (typeof object.Data === "string")
                $util.base64.decode(object.Data, message.Data = $util.newBuffer($util.base64.length(object.Data)), 0);
            else if (object.Data.length)
                message.Data = object.Data;
        if (object.filesize != null)
            if ($util.Long)
                (message.filesize = $util.Long.fromValue(object.filesize)).unsigned = true;
            else if (typeof object.filesize === "string")
                message.filesize = parseInt(object.filesize, 10);
            else if (typeof object.filesize === "number")
                message.filesize = object.filesize;
            else if (typeof object.filesize === "object")
                message.filesize = new $util.LongBits(object.filesize.low >>> 0, object.filesize.high >>> 0).toNumber(true);
        if (object.blocksizes) {
            if (!Array.isArray(object.blocksizes))
                throw TypeError(".Data.blocksizes: array expected");
            message.blocksizes = [];
            for (var i = 0; i < object.blocksizes.length; ++i)
                if ($util.Long)
                    (message.blocksizes[i] = $util.Long.fromValue(object.blocksizes[i])).unsigned = true;
                else if (typeof object.blocksizes[i] === "string")
                    message.blocksizes[i] = parseInt(object.blocksizes[i], 10);
                else if (typeof object.blocksizes[i] === "number")
                    message.blocksizes[i] = object.blocksizes[i];
                else if (typeof object.blocksizes[i] === "object")
                    message.blocksizes[i] = new $util.LongBits(object.blocksizes[i].low >>> 0, object.blocksizes[i].high >>> 0).toNumber(true);
        }
        if (object.hashType != null)
            if ($util.Long)
                (message.hashType = $util.Long.fromValue(object.hashType)).unsigned = true;
            else if (typeof object.hashType === "string")
                message.hashType = parseInt(object.hashType, 10);
            else if (typeof object.hashType === "number")
                message.hashType = object.hashType;
            else if (typeof object.hashType === "object")
                message.hashType = new $util.LongBits(object.hashType.low >>> 0, object.hashType.high >>> 0).toNumber(true);
        if (object.fanout != null)
            if ($util.Long)
                (message.fanout = $util.Long.fromValue(object.fanout)).unsigned = true;
            else if (typeof object.fanout === "string")
                message.fanout = parseInt(object.fanout, 10);
            else if (typeof object.fanout === "number")
                message.fanout = object.fanout;
            else if (typeof object.fanout === "object")
                message.fanout = new $util.LongBits(object.fanout.low >>> 0, object.fanout.high >>> 0).toNumber(true);
        return message;
    };

    /**
     * Creates a plain object from a Data message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Data
     * @static
     * @param {Data} message Data
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Data.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.blocksizes = [];
        if (options.defaults) {
            object.Type = options.enums === String ? "Raw" : 0;
            object.Data = options.bytes === String ? "" : [];
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.filesize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.filesize = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.hashType = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.hashType = options.longs === String ? "0" : 0;
            if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.fanout = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.fanout = options.longs === String ? "0" : 0;
        }
        if (message.Type != null && message.hasOwnProperty("Type"))
            object.Type = options.enums === String ? $root.Data.DataType[message.Type] : message.Type;
        if (message.Data != null && message.hasOwnProperty("Data"))
            object.Data = options.bytes === String ? $util.base64.encode(message.Data, 0, message.Data.length) : options.bytes === Array ? Array.prototype.slice.call(message.Data) : message.Data;
        if (message.filesize != null && message.hasOwnProperty("filesize"))
            if (typeof message.filesize === "number")
                object.filesize = options.longs === String ? String(message.filesize) : message.filesize;
            else
                object.filesize = options.longs === String ? $util.Long.prototype.toString.call(message.filesize) : options.longs === Number ? new $util.LongBits(message.filesize.low >>> 0, message.filesize.high >>> 0).toNumber(true) : message.filesize;
        if (message.blocksizes && message.blocksizes.length) {
            object.blocksizes = [];
            for (var j = 0; j < message.blocksizes.length; ++j)
                if (typeof message.blocksizes[j] === "number")
                    object.blocksizes[j] = options.longs === String ? String(message.blocksizes[j]) : message.blocksizes[j];
                else
                    object.blocksizes[j] = options.longs === String ? $util.Long.prototype.toString.call(message.blocksizes[j]) : options.longs === Number ? new $util.LongBits(message.blocksizes[j].low >>> 0, message.blocksizes[j].high >>> 0).toNumber(true) : message.blocksizes[j];
        }
        if (message.hashType != null && message.hasOwnProperty("hashType"))
            if (typeof message.hashType === "number")
                object.hashType = options.longs === String ? String(message.hashType) : message.hashType;
            else
                object.hashType = options.longs === String ? $util.Long.prototype.toString.call(message.hashType) : options.longs === Number ? new $util.LongBits(message.hashType.low >>> 0, message.hashType.high >>> 0).toNumber(true) : message.hashType;
        if (message.fanout != null && message.hasOwnProperty("fanout"))
            if (typeof message.fanout === "number")
                object.fanout = options.longs === String ? String(message.fanout) : message.fanout;
            else
                object.fanout = options.longs === String ? $util.Long.prototype.toString.call(message.fanout) : options.longs === Number ? new $util.LongBits(message.fanout.low >>> 0, message.fanout.high >>> 0).toNumber(true) : message.fanout;
        return object;
    };

    /**
     * Converts this Data to JSON.
     * @function toJSON
     * @memberof Data
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Data.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * DataType enum.
     * @enum {string}
     * @property {number} Raw=0 Raw value
     * @property {number} Directory=1 Directory value
     * @property {number} File=2 File value
     * @property {number} Metadata=3 Metadata value
     * @property {number} Symlink=4 Symlink value
     * @property {number} HAMTShard=5 HAMTShard value
     */
    Data.DataType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "Raw"] = 0;
        values[valuesById[1] = "Directory"] = 1;
        values[valuesById[2] = "File"] = 2;
        values[valuesById[3] = "Metadata"] = 3;
        values[valuesById[4] = "Symlink"] = 4;
        values[valuesById[5] = "HAMTShard"] = 5;
        return values;
    })();

    return Data;
})();

$root.Metadata = (function() {

    /**
     * Properties of a Metadata.
     * @exports IMetadata
     * @interface IMetadata
     * @property {string} MimeType Metadata MimeType
     */

    /**
     * Constructs a new Metadata.
     * @exports Metadata
     * @classdesc Represents a Metadata.
     * @constructor
     * @param {IMetadata=} [properties] Properties to set
     */
    function Metadata(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Metadata MimeType.
     * @member {string}MimeType
     * @memberof Metadata
     * @instance
     */
    Metadata.prototype.MimeType = "";

    /**
     * Creates a new Metadata instance using the specified properties.
     * @function create
     * @memberof Metadata
     * @static
     * @param {IMetadata=} [properties] Properties to set
     * @returns {Metadata} Metadata instance
     */
    Metadata.create = function create(properties) {
        return new Metadata(properties);
    };

    /**
     * Encodes the specified Metadata message. Does not implicitly {@link Metadata.verify|verify} messages.
     * @function encode
     * @memberof Metadata
     * @static
     * @param {IMetadata} message Metadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Metadata.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        writer.uint32(/* id 1, wireType 2 =*/10).string(message.MimeType);
        return writer;
    };

    /**
     * Encodes the specified Metadata message, length delimited. Does not implicitly {@link Metadata.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Metadata
     * @static
     * @param {IMetadata} message Metadata message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Metadata.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Metadata message from the specified reader or buffer.
     * @function decode
     * @memberof Metadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Metadata} Metadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Metadata.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Metadata();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.MimeType = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        if (!message.hasOwnProperty("MimeType"))
            throw $util.ProtocolError("missing required 'MimeType'", { instance: message });
        return message;
    };

    /**
     * Decodes a Metadata message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Metadata
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Metadata} Metadata
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Metadata.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Metadata message.
     * @function verify
     * @memberof Metadata
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Metadata.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (!$util.isString(message.MimeType))
            return "MimeType: string expected";
        return null;
    };

    /**
     * Creates a Metadata message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Metadata
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Metadata} Metadata
     */
    Metadata.fromObject = function fromObject(object) {
        if (object instanceof $root.Metadata)
            return object;
        var message = new $root.Metadata();
        if (object.MimeType != null)
            message.MimeType = String(object.MimeType);
        return message;
    };

    /**
     * Creates a plain object from a Metadata message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Metadata
     * @static
     * @param {Metadata} message Metadata
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Metadata.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.MimeType = "";
        if (message.MimeType != null && message.hasOwnProperty("MimeType"))
            object.MimeType = message.MimeType;
        return object;
    };

    /**
     * Converts this Metadata to JSON.
     * @function toJSON
     * @memberof Metadata
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Metadata.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return Metadata;
})();

module.exports = $root;
