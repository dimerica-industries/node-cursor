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
	this.rewind();

	this.length = buffer.length;
};

Cursor.prototype =
{
	buffer: function()
	{
		return this._buffer;
	},

	tap: function(cb)
	{
		cb(this);
		return this;
	},

	clone: function(newIndex)
	{
		var c = new this.constructor(this.buffer());
		c.seek(arguments.length === 0 ? this.tell() : newIndex);

		return c;
	},

	tell: function()
	{
		return this._index;
	},

	seek: function(op, index)
	{
		if (arguments.length == 1)
		{
			index = op;
			op = '=';
		}

		if (op == '+')
		{
			this._index += index;
		}
		else if (op == '-')
		{
			this._index -= index;
		}
		else
		{
			this._index = index;
		}

		return this;
	},

	rewind: function()
	{
		return this.seek(0);
	},

	eof: function()
	{
		return this.tell() == this.buffer().length;
	},

	write: function(string, length, encoding)
	{
		return this.seek('+', this.buffer().write(string, this.tell(), length, encoding));
	},

	fill: function(value, length)
	{
		if (arguments.length == 1)
		{
			length = this.buffer().length - this.tell();
		}
		
		this.buffer().fill(value, this.tell(), this.tell() + length);
		this.seek('+', length);

		return this;
	},

	slice: function(length)
	{
		if (arguments.length === 0)
		{
			length = this.length - this.tell();
		}

		var c = new this.constructor(this.buffer().slice(this.tell(), this.tell() + length));
		this.seek('+', length);

		return c;
	},

	copyFrom: function(source)
	{
		var buf = source instanceof Buffer ? source: source.buffer();
		buf.copy(this.buffer(), this.tell(), 0, buf.length);
		this.seek('+', buf.length);

		return this;
	},

	toString: function(encoding, length)
	{
		if (arguments.length === 0)
		{
			encoding = 'utf8';
			length = this.buffer().length - this.tell();
		}
		else if (arguments.length === 1)
		{
			length = this.buffer().length - this.tell();
		}

		var val = this.buffer().toString(encoding, this.tell(), this.tell() + length);
		this.seek('+', length);

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
			var val = this.buffer()[method](this.tell());
			this.seek('+', arr[0]);

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
			val = this.buffer()[method](val, this.tell());
			this.seek('+', arr[0]);

			return this;
		};
	});
});

//basic extend functionality to facilitate
//writing your own cursor while still providing
//access to low level r/w functionality
Cursor.extend = function(C, proto)
{
	var parent = this;

	if (arguments.length === 1)
	{
		proto = C;
		C = null;
	}

	proto = proto || {};

	C = C || function ctor(buffer)
	{
		if (!(this instanceof C))
		{
			return new C(buffer);
		}

		parent.call(this, buffer);
	};

	require('util').inherits(C, parent);

	for (var i in proto)
	{
		C.prototype[i] = extendProto(parent.prototype, i, proto[i]);
	}

	C.extend = parent.extend;

	return C;
};

function extendProto(parentProto, name, fn)
{
	if (!parentProto[name])
	{
		return fn;
	}

	return function()
	{
		this.__super = parentProto[name];
		return fn.apply(this, arguments);
	};
}

module.exports = Cursor;
