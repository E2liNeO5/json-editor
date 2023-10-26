function cancel_handler() {
    location.href = location.href;
}

function addBtnHandler(btn, value) {
    const fields = findBtnFields(btn, [])
    console.log(fields)
    return showAlert(`Add value: ${value}?`, true)
        .then(() => {
            return postRequest('/json_editor_add', { file_name: getFileName(), fields: fields.reverse(), value: value })
        })
        .then(result => showAlert(result.message))
        .then(() => cancel_handler())
        .catch(e => showAlert(e.message))
}

function findBtnFields(btn, fields) {
    let btn_table = btn.parentNode
    while(btn_table.nodeName !== 'DETAILS') {
        btn_table = btn_table.parentNode
        if(!btn_table)
            break
    }
    if(!btn_table)
        return fields
    fields.push(btn_table.firstChild.id)

    if(btn_table.nodeName === 'DETAILS') {
        let array_table = btn_table.parentNode
        while(array_table.dataset && array_table.dataset.table_type !== 'array') {
            array_table = array_table.parentNode
            if(!array_table)
                break
        }
        if(array_table) {
            array_table = array_table.firstChild
            const rows = [...array_table.childNodes]
            rows.forEach((row, index) => {
                if(row.querySelector('details') === btn_table)
                    fields.push(index)
            })
        }
    }

    if(btn_table.parentNode.parentNode.nodeName === 'TR') {
        let closets_tr = btn_table.parentNode.parentNode
        while(closets_tr.firstChild.nodeName !== 'TH') {
            closets_tr = closets_tr.previousSibling
            if(!closets_tr)
                break
        }
        if(closets_tr)
            fields.push(closets_tr.firstChild.dataset.key)
    }

    return findBtnFields(btn_table.parentNode, fields)
}

function saveBtnHandler() {
    const first_details = document.querySelectorAll('.first-level-details')
    const json = {}
    first_details.forEach(details => {
        const key = details.querySelector('summary').id
        const table = details.querySelector('table')
        const rows = [...table.firstChild.childNodes]
        if(table.dataset.table_type === 'value') {
            json[key] = rows[0].childNodes[1].firstChild.value
        } else { 
            json[key] = table.dataset.table_type === 'object' ? {} : []
            let last_object = json[key]
            collectJSON(rows, json[key], last_object)
        }
    })
    console.log(json)
    return showAlert('Save current JSON?', true)
        .then(() => {
            return postRequest('json_editor', { file_name: getFileName(), json })
        })
        .then(result => showAlert(result.message))
        .then(() => cancel_handler())
        .catch(e => showAlert(e.message))
}

function collectJSON(rows, json, last_object, obj_child) {
    rows.forEach(row => {
        if(row.firstChild.nodeName === 'TH') {
            const table_type = row.parentNode.parentNode.dataset.table_type
            const key = row.firstChild.dataset.key
            json[key] = table_type === 'object' ? {} : []
            last_object = json[key]
        } else if(row.childNodes.length === 3) {
            const key = row.firstChild.innerHTML
            if(row.childNodes[1].firstChild.nodeName === 'INPUT') {
                const value = row.childNodes[1].firstChild.value
                if(Array.isArray(last_object) && obj_child) {
                    const new_obj = {}
                    new_obj[key] = value
                    last_object.push(new_obj)
                } else
                    last_object[key] = value
            }
            else if(row.childNodes[1].firstChild.nodeName === 'DETAILS') {
                last_object[key] = []
                const subrows = [...row.childNodes[1].querySelector('table tbody').childNodes]
                collectJSON(subrows, json, last_object[key])
            }
        } else if(row.childNodes.length === 2 && row.firstChild.nodeName === 'TD' && row.firstChild.firstChild.nodeName != 'BUTTON') {
            const objs = [...row.querySelector('table tbody').childNodes]
            if(objs[0].firstChild.nodeName === 'TH') {
                collectJSON(objs, json, last_object)
            } else {
                const new_obj = {}
                objs.forEach(tr => {
                    const tr_key = tr.childNodes[0].innerHTML
                    if(tr.childNodes[1].firstChild.nodeName === 'DETAILS') {
                        const tr_rows = [...tr.querySelector('table tbody').childNodes]
                        new_obj[tr_key] = []
                        collectJSON(tr_rows, json, new_obj[tr_key], true)
                    } else {
                        const tr_value = tr.childNodes[1].firstChild.value
                        new_obj[tr_key] = tr_value
                    }
                })
                last_object.push(new_obj)
            }
        }
    })
}

function getItemType(type) {
    switch(type) {
        default:
        case 'array-item':
            return `<div class="array-item">
                        <input type="text" />
                        <button onclick="this.parentNode.remove()">-</button>
                    </div>`
        case 'key-value-item': 
            return `<div class="key-value-item">
                        <span>"</span><input type="text" /><span>": </span>
                        <span>"</span><input type="text" /><span>"</span>
                        <button onclick="this.parentNode.remove()">-</button>
                    </div>`
    }
}

function getItemStructure(type) {
    switch(type) {
        default:
        case 'key-value':
        return `<div class="item_structure">
                    <div class="key-value-item">
                        <span>"</span><input type="text" /><span>": </span>
                        <span>"</span><input type="text" /><span>"</span>
                        <button class="item_add">+</button>
                    </div>
                </div>`
        case 'key-object':
            return `<div class="item_structure">
                        <span>"</span><input class="item-key" type="text" /><span>": {</span>
                        <div class="key-value-item">
                            <span>"</span><input type="text" /><span>": </span>
                            <span>"</span><input type="text" /><span>"</span>
                            <button class="item_add">+</button>
                        </div>
                    </div>
                    <div>}</div>`
        case 'array':
            return `<div>[</div>
                    <div class="item_structure">
                        <div class="array-item">
                            <input type="text" />
                            <button class="item_add">+</button>
                        </div>
                    </div>
                    <div>]</div>`
        case 'array-key-value':
            return `<div>[</div>
                        <div class="item_structure">
                            <div class="key-value-item">
                                <span>"</span><input type="text" /><span>": </span>
                                <span>"</span><input type="text" /><span>"</span>
                                <button class="item_add">+</button>
                            </div>
                        </div>
                    <div>]</div>`
        case 'array-object':
            return `<div>[{</div>
                    <div class="item_structure">
                        <div class="key-value-item">
                            <span>"</span><input type="text" /><span>": </span>
                            <span>"</span><input type="text" /><span>"</span>
                            <button class="item_add">+</button>
                        </div>
                    </div>
                    <div>}]</div>`
        case 'key-array':
            return `<div class="item_structure">
                        <span>"</span><input class="item-key" type="text" /><span>": [</span>
                        <div class="array-item">
                            <input type="text" />
                            <button class="item_add">+</button>
                        </div>
                    </div>
                    <div>]</div>`
        case 'key-array-key-value':
            return `<div class="item_structure">
                        <span>"</span><input class="item-key" type="text" /><span>": [</span>
                        <div class="key-value-item">
                            <span>"</span><input type="text" /><span>": </span>
                            <span>"</span><input type="text" /><span>"</span>
                            <button class="item_add">+</button>
                        </div>
                    </div>
                    <div>]</div>`
        case 'key-array-object':
            return `<div class="item_structure">
                        <span>"</span><input class="item-key" type="text" /><span>": [{</span>
                        <div class="key-value-item">
                            <span>"</span><input type="text" /><span>": </span>
                            <span>"</span><input type="text" /><span>"</span>
                            <button class="item_add">+</button>
                        </div>
                    </div>
                    <div>}]</div>`
    }
}

function showAddModal(btn) {
    document.body.style = 'overflow: hidden'
    const html = `
        <div class="add-modal-overlay">
            <div class="add-modal-container">
                <select id="modal-item-type">
                    <option value="key-value">Key-value</option>
                    <option value="key-object">Key-object</option>
                    ${btn.dataset.array_type ? '<option value="array">Array</option>' : ''}
                    ${btn.dataset.array_type ? '<option value="array-key-value">Array key-value</option>' : ''}
                    ${btn.dataset.array_type ? '<option value="array-object">Array object</option>' : ''}
                    <option value="key-array">Key-array</option>
                    <option value="key-array-key-value">Key-array key-value</option>
                    <option value="key-array-object">Key-array object</option>
                </select>
                <div class="add-modal-item-structure">${getItemStructure('key-value')}</div>

                <div class="add-modal-buttons">
                    <button id="add-modal-btn-add">Add</button>
                    <button id="add-modal-btn-cancel">cancel</button>
                </div>
            </div>
        </div>`

    document.body.insertAdjacentHTML('beforeend', html)

    const modal_overlay = document.querySelector('.add-modal-overlay')
    const modal_item_structure = document.querySelector('.add-modal-item-structure')
    const add_btn = document.querySelector('#add-modal-btn-add')
    const cancel_btn = document.querySelector('#add-modal-btn-cancel')
    const modal_item_type = document.querySelector('#modal-item-type')

    modal_overlay.style = `top: ${window.scrollY}px; bottom: -${window.scrollY}px`

    cancel_btn.addEventListener('click', () => {
        modal_overlay.remove()
        document.body.style = 'overflow: auto'
    })

    let item_add_btns = document.querySelectorAll(".item_add")
    item_add_btns.forEach(item_add => {
        item_add.addEventListener('click', () => {
            const parent = item_add.parentNode
            const type = parent.className
            parent.parentNode.insertAdjacentHTML('beforeend', getItemType(type))

        })
    })
    modal_item_type.addEventListener('change', () => {
        modal_item_structure.innerHTML = getItemStructure(modal_item_type.value)
        item_add_btns = document.querySelectorAll(".item_add")
        item_add_btns.forEach(item_add => {
            item_add.addEventListener('click', () => {
                const parent = item_add.parentNode
                const type = parent.className
                parent.parentNode.insertAdjacentHTML('beforeend', getItemType(type))
            })
        })
    })

    add_btn.addEventListener('click', () => {
        try {
            const item_structure = modal_item_structure.querySelector('.item_structure')
            let json = {}
            let key
            let new_obj = {}
            switch(modal_item_type.value) {
                case 'key-value':
                    item_structure.querySelectorAll('.key-value-item').forEach(block => {
                        const inputs = block.querySelectorAll('input')
                        key = inputs[0].value
                        json[key] = inputs[1].value
                    })
                    break
                case 'key-object':
                    key = item_structure.querySelector('input.item-key').value
                    json[key] = {}
                    item_structure.querySelectorAll('.key-value-item').forEach(block => {
                        const inputs = block.querySelectorAll('input')
                        const obj_key = inputs[0].value
                        json[key][obj_key] = inputs[1].value
                    })
                    break
                case 'array':
                    key = 'array'
                    json = []
                    item_structure.querySelectorAll('.array-item').forEach(block => {
                        json.push(block.querySelector('input').value)
                    })
                    break
                case 'array-key-value':
                    key = 'array'
                    json = []
                    item_structure.querySelectorAll('.key-value-item').forEach(block => {
                        const inputs = block.querySelectorAll('input') 
                        new_obj = {}
                        new_obj[inputs[0].value] = inputs[1].value
                        json.push(new_obj)
                    })
                    break
                case 'array-object':
                    key = 'array'
                    json = []
                    new_obj = {}
                    item_structure.querySelectorAll('.key-value-item').forEach(block => {
                        const inputs = block.querySelectorAll('input')
                        new_obj[inputs[0].value] = inputs[1].value
                    })
                    json.push(new_obj)
                    break
                case 'key-array':
                    key = item_structure.querySelector('input.item-key').value
                    json[key] = []
                    item_structure.querySelectorAll('.array-item').forEach(block => {
                        json[key].push(block.querySelector('input').value)
                    })
                    break
                case 'key-array-key-value':
                    key = item_structure.querySelector('input.item-key').value
                    json[key] = []
                    item_structure.querySelectorAll('.key-value-item').forEach(block => {
                        const inputs = block.querySelectorAll('input') 
                        const new_obj = {}
                        new_obj[inputs[0].value] = inputs[1].value
                        json[key].push(new_obj)
                    })
                    break
                case 'key-array-object':
                    key = item_structure.querySelector('input.item-key').value
                    json[key] = []
                    item_structure.querySelectorAll('.key-value-item').forEach(block => {
                        const inputs = block.querySelectorAll('input')
                        new_obj[inputs[0].value] = inputs[1].value
                    })
                    json[key].push(new_obj)
                    break
            }
            if(!key)
                throw new Error('Enter field name')
            addBtnHandler(btn, JSON.stringify(json))
        } catch (e) {
            showAlert(e.message)
        }
    })
}

function getRootItemStructure(type) {
    switch(type) {
        case 'key-object':
            return `<span>"</span><input type="text" /><span>": {}</span>`
        case 'key-array':
            return `<span>"</span><input type="text" /><span>": []</span>`
        case 'key-value':
            return `<span>"</span><input type="text" /><span>": "</span><input type="text" /><span>"</span>`
    }
}

function add_handler() {
    document.body.style = 'overflow: hidden'
    const html = `
        <div class="add-modal-overlay">
            <div class="add-modal-container">
                <select id="modal-item-type">
                    <option value="key-object">Key-object</option>
                    <option value="key-array">Key-array</option>
                    <option value="key-value">Key-value</option>
                </select>
                <div class="add-modal-item-structure">${getRootItemStructure('key-object')}</div>

                <div class="add-modal-buttons">
                    <button id="add-modal-btn-add">Add</button>
                    <button id="add-modal-btn-cancel">Cancel</button>
                </div>
            </div>
        </div>`

    document.body.insertAdjacentHTML('beforeend', html)
    
    const modal_overlay = document.querySelector('.add-modal-overlay')
    const modal_item_structure = document.querySelector('.add-modal-item-structure')
    const add_btn = document.querySelector('#add-modal-btn-add')
    const cancel_btn = document.querySelector('#add-modal-btn-cancel')
    const modal_item_type = document.querySelector('#modal-item-type')

    modal_overlay.style = `top: ${window.scrollY}px; bottom: -${window.scrollY}px`

    cancel_btn.addEventListener('click', () => {
        modal_overlay.remove()
        document.body.style = 'overflow: auto'
    })

    modal_item_type.addEventListener('change', () => {
        modal_item_structure.innerHTML = getRootItemStructure(modal_item_type.value)
    })

    add_btn.addEventListener('click', () => {
        try {
            let value
            let key
            switch(modal_item_type.value) {
                case 'key-object':
                    key = modal_item_structure.querySelector('input').value
                    value = {}
                    break
                case 'key-array':
                    key = modal_item_structure.querySelector('input').value
                    value = []
                    break
                case 'key-value':
                    const inputs = modal_item_structure.querySelectorAll('input')
                    key = inputs[0].value
                    value = inputs[1].value
                    break
            }
            if(!key)
                throw new Error('Enter field name')
            if(!value)
                throw new Error('Enter value')
            return postRequest('json_editor_add_root', { file_name: getFileName(), key, value })
                .then(result => showAlert(result.message))
                .then(() => cancel_handler())
        } catch (e) {
            showAlert(e.message)
        }
    })
}

function findDeleteFields(btn, fields) {
    const btn_row = btn.parentNode.parentNode
    const btn_table = btn_row.parentNode.parentNode

    if(btn_table.firstChild.firstChild === btn_row && btn_table.parentNode.className === 'first-level-details') {
        fields.push(btn_row.firstChild.innerHTML)
        fields.push(btn_table.parentNode.firstChild.id)
        return fields
    }

    if(btn_table.dataset.table_type === 'object') {
        const subfield = btn_row.firstChild.innerHTML
        fields.push(subfield)
        if(btn_row.firstChild.nodeName === 'TD') {
            let prev_row = btn_row.previousSibling
            while(prev_row && prev_row.firstChild.nodeName !== 'TH') {
                prev_row = prev_row.previousSibling
            }
            if(prev_row)
                fields.push(prev_row.firstChild.innerHTML)
        }
        if(btn_table.parentNode.nodeName === 'TD') {
            findDeleteFields(btn_table, fields)
        } else {
            const root_field = btn_table.previousSibling.id
            fields.push(root_field)
        }
    } else {
        const table_rows = [...btn_table.firstChild.childNodes]
        table_rows.forEach((row, index) => {
            if(row === btn_row)
                fields.push(index)
        })
        if(btn_table.parentNode.parentNode.nodeName === 'TD')
            findDeleteFields(btn_table.parentNode, fields)
        else {
            fields.push(btn_table.parentNode.firstChild.id)
        }
    }
    return fields
}

function deleteItem(btn) {
    const fields = findDeleteFields(btn, [])
    const field = fields[0]
    console.log(fields)
    return showAlert(`Delete item?`, true)
        .then(() => {
            return postRequest('/json_editor_delete',
                { file_name: getFileName(), path: fields.filter(path_field => path_field !== field).reverse(), field  })
        })
        .then(result => showAlert(result.message))
        .then(() => cancel_handler())
        .catch(e => showAlert(e.message))
}

async function deleteRootItem(btn) {
    const field = btn.parentNode.id
    console.log(field)
    return showAlert(`Delete root item?`, true)
        .then(() => {
            return postRequest('/json_editor_delete', { file_name: getFileName(), path: [], field  })
        })
        .then(result => showAlert(result.message))
        .then(() => cancel_handler())
        .catch(e => showAlert(e.message))
}

function showAlert(message, confirm) {
    return new Promise((resolve, reject) => {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="alert-overlay">
                <div class="alert-container">
                    <p>${message}</p>
                    <div class="alert-buttons">
                        <button class="alert-ok">Ok</button>
                        ${confirm ? '<button class="alert-cancel">Cancel</button>' : ''}
                    </div>
                </div>
            </div>
        `)
        const alert = document.querySelector('.alert-overlay')
        alert.style = `top: ${window.scrollY}px; bottom: -${window.scrollY}px`
        document.body.style = 'overflow: hidden'

        document.querySelector('.alert-ok').addEventListener('click', () => {
            alert.remove()
            document.body.style = 'overflow: auto'
            resolve()
        })
        if(confirm) {
            document.querySelector('.alert-cancel').addEventListener('click', () => {
                alert.remove()
                document.body.style = 'overflow: auto'
                reject()
            })
        }
    })
}

async function postRequest(url, params) {
    const result = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(params)
    })
    return await result.json()
}
function getFileName() {
    return document.body.getAttribute('file_name')
}
const dropdowns = document.querySelectorAll('.first-level-details')

dropdowns.forEach(dropdown => {
    if(location.hash && '#' + dropdown.querySelector('summary').id !== location.hash)
        dropdown.open = false
})

document.querySelectorAll('.add_btn').forEach(btn => {
    btn.addEventListener('click', () => showAddModal(btn))
})
document.querySelectorAll('.delete_btn').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(btn))
})
document.querySelectorAll('.delete_root_btn').forEach(btn => {
    btn.addEventListener('click', () => deleteRootItem(btn))
})
document.querySelector('#save').addEventListener('click', saveBtnHandler)
document.querySelector('#cancel').addEventListener('click', cancel_handler)
document.querySelector('#add').addEventListener('click', add_handler)