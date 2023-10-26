const express = require('express')
const fsp = require('fs/promises')
const bodyParser = require('body-parser')

const app = express()

app.listen(5000, () => {
  console.log('Server has been started')
})

app.set('view engine', 'jade')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  const test_json = 'test.json'
  const json = await fsp.readFile(test_json, {encoding: 'utf8'})
  res.render('index', { json: JSON.parse(json), file_name: test_json })
})

app.post('/json_editor_add', async (req, res) => {
  const {file_name, fields, value} = req.body;
	try {
		const text = await fsp.readFile(file_name, {encoding: 'utf8'})
		const json = JSON.parse(text)
		const json_value = JSON.parse(value)
		let found_obj = json
		fields.forEach(field => {
				found_obj = found_obj[field] 
		})
		if(Array.isArray(found_obj)) {
				if(Array.isArray(json_value))
						found_obj.push(...json_value)
				else
						found_obj.push(json_value)
		} else {
				for(let key of Object.keys(json_value)) {
						found_obj[key] = json_value[key]
				}
		}
		let str = JSON.stringify(json, null, 4);
		await fsp.writeFile(file_name, str)
		res.json({ message: 'File saved' })
	} catch (e) {
		res.json({ message: e.message })
	}
});

app.post('/json_editor', async (req, res) => {
  const {file_name, json} = req.body;
	try {
		let str = JSON.stringify(json, null, 4);
		await fsp.writeFile(file_name, str)
		res.json({ message: 'File saved' })
	} catch (e) {
		res.json({ message: e.message })
	}
});

app.post('/json_editor_add_root', async (req, res) => {
  const {file_name, key, value} = req.body;
	try {
		const text = await fsp.readFile(file_name, {encoding: 'utf8'})
		const json = JSON.parse(text)
		json[key] = value
		let str = JSON.stringify(json, null, 4);
		await fsp.writeFile(file_name, str)
		res.json({ message: 'File saved' })
	} catch (e) {
		res.json({ message: e.message })
	}
});

app.post('/json_editor_delete', async (req, res) => {
  const {file_name, path, field} = req.body;
	try {
		const text = await fsp.readFile(file_name, {encoding: 'utf8'})
		const json = JSON.parse(text)
		let found_obj = json
		path.forEach(path_field => {
				found_obj = found_obj[path_field] 
		})
		if(Array.isArray(found_obj))
				found_obj.splice(+field, 1)
		else
				delete found_obj[field]
		const str = JSON.stringify(json, null, 4);
		await fsp.writeFile(file_name, str)
		res.json({ message: 'File saved' })
	} catch (e) {
		res.json({ message: e.message })
	}
});