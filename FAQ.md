# FAQ

## Table of Contents <a name='table'></a>
- [Known Error Fixed](#common-occured-error)
  - [this.isZero() not a function](#zero)
  - [crash when added to a group](#crash)
- [Additional Context](#additional-context)
- [Instagram method](#instagram-methods)

---

# Common Occured Error

### <a name="zero"></a> this.isZero() not a function

Go to `node_modules\long\src\long.js:474`

Add this code to line 474 (don't change the original 474 code. just add the code below) :

```js
if (typeof this.isZero !== 'function') {
	return '1';
}
```

### <a name="crash"></a> crash when added to a group

Please install the latest Baileys-md commit

# Additional Context

### Changing ID message :

Go to

```sh
node_modules\@adiwajshing\baileys\lib\Utils\generic.js:172
```

> **IMPORTANT** 
> Change the `BAE5` to anything. (`DO NOT` includes special characters!)

#### Or you can include `customId` to the socket config.

```javascript
const CONNECTION_CONFIG = {
	...YOUR_CONFIG,
	customId: 'HFINDER'
};
```

<div align='center'>
<a href='#table'>⬆️</a>
</div>

# Instagram Methods
#### before started you must do a login method
```javascript
const login = async () => {
  const instagram = new InstagramApi('username', 'password');

  const login = await instagram.account.login();

  login.account.writeLoginInfo();
}

 await login()
 ```
 
<div align='center'>
<a href='#table'>⬆️</a>
</div>