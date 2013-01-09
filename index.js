var Cursor = function(buffer)
{
	if (!(this instanceof Cursor))
	{
		return new Cursor(buffer);
	}

	if (!(buffer instanceof Buffer))
	{
		buffer = new Buffer(buffer);
	}

	this._buffer = buffer;
	this._index = 0;

	this.length = buffer.length;
};

Cursor.prototype =
{
	buffer: function()
	{
		return this._buffer;
	},

	clone: function(newIndex)
	{
		var c = new this.constructor(this._buffer);
		c._index = newIndex;

		if (arguments.length === 0)
		{
			c._index = this._index;
		}

		return c;
	},

	tell: function()
	{
		return this._index;
	},

	seek: function(index)
	{
		this._index = index;
		return this;
	},

	rewind: function()
	{
		return this.seek(0);
	},

	eof: function()
	{
		return this._index == this._buffer.length;
	},

	write: function(string, length, encoding)
	{
		this._index += this._buffer.write(string, this._index, length, encoding);
		return this;
	},

	fill: function(value, length)
	{
		if (arguments.length == 1)
		{
			length = this._buffer.length - this._index;
		}
		
		this._buffer.fill(value, this._index, this._index + length);
		this._index += length;

		return this;
	},

	slice: function(length)
	{
		if (arguments.length === 0)
		{
			length = this.length - this._index;
		}

		var c = new this.constructor(this._buffer.slice(this._index, this._index + length));
		this._index += length;

		return c;
	},

	copyFrom: function(source)
	{
		var buf = source instanceof Buffer ? source: source._buffer;
		buf.copy(this._buffer, this.tell(), 0, buf.length);
		this._index += buf.length;

		return this;
	},

	toString: function(encoding, length)
	{
		if (arguments.length === 0)
		{
			encoding = 'utf8';
			length = this._buffer.length - this._index;
		}
		else if (arguments.length === 1)
		{
			length = this._buffer.length - this._index;
		}

		var val = this._buffer.toString(encoding, this._index, this._index + length);
		this._index += length;

		return val;
	}
};

[
	[1, ['readInt8', 'readUInt8']],
	[2, ['readInt16BE', 'readInt16LE', 'readUInt16BE', 'readUInt16LE']],
	[4, ['readInt32BE', 'readInt32LE', 'readUInt32BE', 'readUInt32LE', 'readFloatBE', 'readFloatLE']],
	[8, ['readDoubleBE', 'readDoubleLE']]
].forEach(function(arr)
{
	arr[1].forEach(function(method)
	{
		Cursor.prototype[method] = function()
		{
			var val = this._buffer[method](this._index);
			this._index += arr[0];

			return val;
		};
	});
});

[
	[1, ['writeInt8', 'writeUInt8']],
	[2, ['writeInt16BE', 'writeInt16LE', 'writeUInt16BE', 'writeUInt16LE']],
	[4, ['writeInt32BE', 'writeInt32LE', 'writeUInt32BE', 'writeUInt32LE', 'writeFloatBE', 'writeFloatLE']],
	[8, ['writeDoubleBE', 'writeDoubleLE']]
].forEach(function(arr)
{
	arr[1].forEach(function(method)
	{
		Cursor.prototype[method] = function(val)
		{
			val = this._buffer[method](val, this._index);
			this._index += arr[0];

			return this;
		};
	});
});

module.exports = Cursor;
