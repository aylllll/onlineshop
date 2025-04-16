function shopindexfunction() {
    const whologin = indexgetShop()
    Chart.register(ChartDataLabels)
    showShopProduct(0, 40, 1, whologin).then(() => {
        //商家导航栏
        shopnav(whologin)
        logout(whologin)
        openANDcloseBox(whologin)
        //搜索主页商品
        searchProduct(whologin)
        //搜索订单
        ShopsearchOrder(whologin)
        //添加商品
        addproduct(whologin)
    })
}
//打开和关闭遮罩层
function openModal(id) {
    document.getElementById(id).classList.add("active")
}
function closeModal(id) {
    document.getElementById(id).classList.remove("active")
}
//请求数据
async function fetchdatas(url, requestBody) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        })
        return await response.json()
    } catch (error) {
        console.error('获取数据失败:', error)
        return { success: false, data: [] }
    }
}
//主页从url读取用户信息
function indexgetShop() {
    let urlParams = new URLSearchParams(window.location.search)
    let whologin = {
        who: urlParams.get('who') ? urlParams.get('who') : 'nobody',
        name: urlParams.get('name'),
        email: urlParams.get('email')
    }
    return whologin
}
//--------------导航栏操作------------------
//显示导航栏
function shopnav(whologin) {
    const username = document.querySelector('.productbox .searchbox .usermessage .username')
    if (whologin.name) username.innerText = `${whologin.name}，欢迎回来`
}
//退出登录
function logout(whologin) {
    const getlogout = document.querySelector('.navbox .logout')
    let isLoggingOut = false // 防止重复执行
    // 退出按钮点击事件
    getlogout.addEventListener('click', function () {
        if (isLoggingOut) return
        isLoggingOut = true
        logoutTime(1)
        window.location.replace('http://localhost')
    })
    // 监听窗口关闭
    window.addEventListener("beforeunload", (event) => {
        console.log(whologin)
        if (isLoggingOut) return
        isLoggingOut = true
        logoutTime(2)
    }, { once: true })
    // 退出请求
    function logoutTime(status) {
        try {
            fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    who: whologin.who,
                    email: whologin.email,
                    name: whologin.name,
                    status
                })
            })
        } catch (err) {
            console.error('数据发送失败:', err);
        }
    }
}
//点击浏览不同的box
function openANDcloseBox(whologin) {
    document.querySelector('.navbox').addEventListener('click', async (event) => {
        const activeElement = document.querySelector('.navbox div.active')
        if (!activeElement) return
        const beOpenBox = event.target.closest('.goproductbox, .gochartbox, .goorderbox')?.classList[0]
        if (!beOpenBox || activeElement.classList.contains(beOpenBox)) return
        const activeBoxId = activeElement.classList[0]
        //关闭当前的box
        switch (activeBoxId) {
            case 'goproductbox':
                break
        }
        activeElement.classList.remove('active')
        document.getElementById(activeBoxId)?.classList.remove('active')
        //打开点击的box
        document.getElementById(beOpenBox)?.classList.add('active')
        document.querySelector(`.${beOpenBox}`)?.classList.add('active')
        //重置打开的box的搜索框
        const searchBox = document.querySelector(`#${beOpenBox} .searchbox`)
        if (searchBox) {
            searchBox.querySelector('.select-category').value = '全部'
            searchBox.querySelector('input').value = ''
        }
        // 对应的box查询展示对应的数据
        const actionMap = {
            'goproductbox': async () => await showShopProduct(0, 40, 1, whologin),
            'gochartbox': async () => await showShopChart(whologin),
            'goorderbox': async () => await showShopOrder(0, 10, 1, whologin)
        }
        await actionMap[beOpenBox]?.()
    })
}
//修改搜索框的不同选择
function searchboxshowselectcategory(selectinput, value) {
    const selectbox = selectinput.parentNode
    const input = selectbox.querySelector('input')
    const selectcategory = selectbox.querySelector('.select-category')
    input.value = ''
    let placeholderText = ''
    selectcategory.value = '全部'
    switch (value) {
        case 'shop':
            placeholderText = '请输入店铺名'
            break
        case 'pname':
            placeholderText = '请输入商品名称'
            break
        case 'orderid':
            placeholderText = '请输入订单编号'
            break
        case 'useremail':
            placeholderText = '请输入用户邮箱'
            break
        default:
            placeholderText = '请输入内容'
    }
    input.placeholder = placeholderText
    selectcategory.style.display = (value == 'pname') ? 'block' : 'none'
}
//--------------商品展示区----------------------
//读取商品
async function showShopProduct(offset, limit, page, whologin) {
    try {
        openModal('productboxloadingOverlay')
        const requestBody = {
            offset,
            limit,
            email: whologin.email
        }
        const res = await fetchdatas('/showShopProduct', requestBody)
        await renderShopProduct(res.products, res.productslength, page, whologin)
        closeModal('productboxloadingOverlay')
    } catch (error) {
        console.error('获取数据失败:', error)
    }
}
//渲染用户主页商品
async function renderShopProduct(data, productslength, page, whologin) {
    const products = document.querySelector('.productbox .products')
    products.innerHTML = ' '
    if (!data.length || !data) {
        //渲染切换页面按钮
        renderswitchpagebutton(1, 'productbox', productslength)
        //点击按钮切换商品页面
        switchproductbox(whologin)
        document.querySelector('.productboxtop')?.scrollIntoView({ behavior: 'smooth' })
        return
    }
    const fragment = document.createDocumentFragment()
    data.forEach(product => {
        const pro = document.createElement('div')
        pro.classList.add('product')
        pro.setAttribute('id', `${product.id}`)
        pro.innerHTML = `
        <img src = "${product.image_url}" alt = "${product.pname}">
        <div class="product-message">
            <div class="product-name">${product.pname}</div>
            <div class="category">类别：${product.category}</div>
            <div class="price">¥${product.price}</div>
            <div class="stock">库存：${product.stock}件</div>
        </div>
        <div class="change-message" style="display: none;">
            <div class="change-name">
                商品名字 <input type="text" min="0" class="change-name-input" value="">
            </div>
            <div class=" change-category">
                商品类别
                <select class="change-category-select">
                    <option value="电子产品">电子产品</option>
                    <option value="服装">服装</option>
                    <option value="生活用品">生活用品</option>
                    <option value="饮食">饮食</option>
                </select>
            </div>
            <div class="change-price">
                商品单价 <input type="number" step="0.01" min="0" class="change-price-input">
            </div>
            <div class="change-stock">
                库存数量 <input type="number" min="0" class="change-stock-input" value="">
            </div>
        </div>
        <div class="options">
            <button class="changepro">更改商品</button>
            <button class="finishchange" style="display: none;">完成</button>
            <button class="uploadimg" style="display: none;">更改图片</button>
            <button class="cancel" style="display: none;">取消</button>
            <button class="deletepro">删除商品</button>
        </div>`
        fragment.appendChild(pro)
    })
    products.appendChild(fragment)
    //渲染切换页面按钮
    renderswitchpagebutton(page, 'productbox', productslength)
    // //点击按钮切换商品页面
    switchproductbox(whologin)
    changepro()
    finishchange(whologin)
    loadproimg()
    cancelchange()
    deleteproduct(whologin)

    document.querySelector('.productboxtop')?.scrollIntoView({ behavior: 'smooth' })
}
//渲染切换页面按钮（商家端/主页用户共用）
function renderswitchpagebutton(page, box, datalength) {
    const switchpage = document.querySelector(`.${box} .switch-page`)
    switchpage.innerHTML = ""
    let pagenumber = 1
    switch (box) {
        case 'productbox':
            pagenumber = 40
            break
        case 'orderbox':
            pagenumber = 10
            break
    }
    let buttonlength = Math.ceil(datalength / pagenumber) // 向上取整，确保有足够的页数
    // “上一页”按钮
    if (page > 1) {
        const beforepagebutton = document.createElement('button')
        beforepagebutton.classList.add('before-page')
        beforepagebutton.innerText = '上一页'
        switchpage.appendChild(beforepagebutton)
    }
    // 数字页码按钮
    for (let i = 1; i <= buttonlength; i++) {
        const switchbutton = document.createElement('button')
        switchbutton.innerText = i
        switchbutton.classList.add('number-page')
        if (i == page) {
            switchbutton.classList.add("active")
            switchbutton.disabled = true
        }
        switchpage.appendChild(switchbutton)
    }
    // “下一页”按钮（仅在当前页小于最大页数时显示）
    if (page < buttonlength) {
        const nextpagebutton = document.createElement('button')
        nextpagebutton.classList.add('next-page')
        nextpagebutton.innerText = '下一页'
        switchpage.appendChild(nextpagebutton)
    }
}
//点击按钮切换商品页面
function switchproductbox(whologin) {
    const switchPageContainer = document.querySelector('.productbox .switch-page')
    switchPageContainer.replaceWith(switchPageContainer.cloneNode(true))
    const newSwitchPageContainer = document.querySelector('.productbox .switch-page')
    newSwitchPageContainer.addEventListener('click', function (event) {
        const target = event.target
        const nowPage = Number(document.querySelector('.productbox .switch-page .active').innerText)
        switch (true) {
            case target.classList.contains('number-page'):
                productSearch('/SwitchShopProductbox', Number(target.innerText), whologin)
                break
            case target.classList.contains('before-page') && nowPage > 1:
                productSearch('/SwitchShopProductbox', nowPage - 1, whologin)
                break
            case target.classList.contains('next-page'):
                productSearch('/SwitchShopProductbox', nowPage + 1, whologin)
                break
        }
    })
}
//商品筛选
async function productSearch(url, pageNum, whologin) {
    const searchUserInput = document.querySelector('.productbox .searchbox input')
    const categorySelect = document.querySelector('.productbox .searchbox .select-category')
    const query = searchUserInput.value.trim()
    const selectedCategory = categorySelect.value
    const offset = (pageNum - 1) * 40
    const limit = 40
    // 如果既没输入内容，又选择了 "全部"，就查询所有购物车商品
    if (!query && selectedCategory === '全部') {
        await showShopProduct(offset, limit, pageNum, whologin)
        return
    }
    const requestBody = {
        searchUserinput: query,
        category: selectedCategory,
        email: whologin.email,
        name: whologin.name,
        offset,
        limit
    }
    const res = await fetchdatas(url, requestBody)
    renderShopProduct(res.data, res.productslength, pageNum, whologin)
}
//搜索商品
function searchProduct(whologin) {
    const searchProductbutton = document.querySelector('.productbox .searchbox .searchbutton')
    const searchUserInput = document.querySelector('.productbox .searchbox input')
    const categorySelect = document.querySelector('.productbox .searchbox .select-category')
    searchProductbutton.addEventListener('click', function () {
        productSearch('/ShopSearchProduct', 1, whologin)
    })
    searchUserInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            productSearch('/ShopSearchProduct', 1, whologin)
        }
    })
    categorySelect.addEventListener('change', function () {
        productSearch('/ShopSearchProduct', 1, whologin)
    })
}
//-------------修改商品信息区----------------------------
//修改商品按钮
function changepro() {
    document.querySelectorAll('.productbox .products .product .options .changepro').forEach(button => {
        button.addEventListener('click', function () {
            const changeprobuttons = document.querySelectorAll('.productbox .products .product .options .changepro')
            if (Array.from(changeprobuttons).filter(btn => btn.style.display === 'none').length > 0) {
                const message = document.querySelector('#productboxfinishOverlay p')
                message.innerText = '一次只能修改一个商品'
                openModal('productboxfinishOverlay')
                return
            }
            const product = button.closest('.product')
            const productImage = product.querySelector('img')
            const pname = product.querySelector('.product-name')
            const price = parseFloat(product.querySelector('.price').textContent.replace(/[^\d.]/g, '')) || 0
            const category = product.querySelector('.category').innerText.split('：')[1]?.trim()
            const stock = parseInt(product.querySelector('.stock').textContent.replace(/[^\d.]/g, '')) || 0
            // 保存修改前的信息
            product.dataset.originalImage = productImage.src
            product.dataset.originalName = pname.innerText
            product.dataset.originalPrice = price
            product.dataset.originalCategory = category
            product.dataset.originalStock = stock
            // 显示修改框
            const changemessage = product.querySelector('.change-message')
            const productmessagens = product.querySelector('.product-message')
            productmessagens.style.display = 'none'
            changemessage.style.display = 'block'
            // 填充当前值到修改框
            changemessage.querySelector('.change-name-input').value = pname.innerText
            changemessage.querySelector('.change-price-input').value = price
            changemessage.querySelector('.change-category-select').value = category
            changemessage.querySelector('.change-stock-input').value = stock
            // 隐藏相关按钮
            const options = product.querySelector('.options')
            options.querySelectorAll('button').forEach(button => {
                const targetClasses = ['changepro', 'deletepro']
                if (targetClasses.some(className => button.classList.contains(className))) {
                    button.style.display = 'none'
                } else {
                    button.style.display = 'block'
                }
            })
        })
    })
}
let temporaryimg = []
//完成修改按钮
function finishchange(whologin) {
    document.querySelectorAll('.productbox .products .product .options .finishchange').forEach(button => {
        button.addEventListener('click', async function () {
            const options = button.closest('.options')
            const product = button.closest('.product')
            const changemessage = product.querySelector('.change-message')
            const productmessages = product.querySelector('.product-message')
            productmessages.style.display = 'block'
            const pname = productmessages.querySelector('.product-name')
            const image_url = product.querySelector('img').src
            const price = productmessages.querySelector('.price')
            const category = productmessages.querySelector('.category')
            const stock = productmessages.querySelector('.stock')
            changemessage.style.display = 'none'
            const newpname = changemessage.querySelector('.change-name-input').value
            const newprice = changemessage.querySelector('.change-price-input').value
            const newcategory = changemessage.querySelector('.change-category-select').value
            const newstock = changemessage.querySelector('.change-stock-input').value
            pname.innerText = newpname
            price.innerText = `￥${(isNaN(newprice) || newprice < 0 || !newprice) ? 0 : newprice}`
            category.innerText = `类别：${newcategory}`
            stock.innerText = `库存：${(isNaN(newstock) || newstock < 0 || !newstock) ? 0 : parseInt(newstock)}件`
            options.querySelectorAll('button').forEach(button => {
                const targetClasses = ['changepro', 'deletepro']
                if (targetClasses.some(className => button.classList.contains(className))) {
                    button.style.display = 'block'
                }
                else button.style.display = 'none'
            })
            try {
                const requestBody = {
                    name: whologin.name,
                    pname: newpname,
                    price: (isNaN(newprice) || newprice < 0 || !newprice) ? 0 : newprice,
                    category: newcategory,
                    stock: (isNaN(newstock) || newstock < 0 || !newstock) ? 0 : parseInt(newstock),
                    image_url: image_url,
                    email: whologin.email,
                    proID: product.getAttribute('id'),
                    temporaryimg
                }
                const res = await fetchdatas('/finishchange', requestBody)
                temporaryimg = []
                const message = document.querySelector('#productboxfinishOverlay p')
                message.innerText = res.message
                openModal('productboxfinishOverlay')
            } catch (error) {
                console.error('获取产品数据失败:', error)
            }
        })
    })
}
// 上传图片按钮
function loadproimg() {
    const imguploadbutton = document.querySelectorAll('.productbox .products .product .options .uploadimg')
    imguploadbutton.forEach(button => {
        button.addEventListener('click', function (event) {
            // 创建一个隐藏的文件输入框
            const fileInput = document.createElement('input')
            fileInput.type = 'file'
            fileInput.accept = 'image/*'// 限制选择图片文件
            fileInput.style.display = 'none'
            // 将文件输入框加入到按钮所在的父元素中
            button.parentElement.appendChild(fileInput)
            // 触发文件选择对话框
            fileInput.click()
            // 监听文件选择事件
            fileInput.addEventListener('change', function (event) {
                const product = button.closest('.product')
                const file = event.target.files[0]
                if (file) {
                    const newimg = new FormData()
                    newimg.append('image', file)
                    fetch('/uploadimg', {
                        method: 'POST',
                        body: newimg
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // 更新商品图片的 src，使用服务器返回的图片路径
                                product.querySelector('img').src = data.filePath;
                                temporaryimg.push(data.filePath)
                            } else {
                                const message = document.querySelector('#productboxfinishOverlay p')
                                message.innerText = '上传图片失败'
                                openModal('productboxfinishOverlay')
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error)
                        })
                }
                fileInput.remove()
            })
        })
    })
}
//取消修改按钮
function cancelchange() {
    document.querySelectorAll('.productbox .products .product .options .cancel').forEach(button => {
        button.addEventListener('click', function () {
            const product = button.closest('.product')
            const changemessage = product.querySelector('.change-message')
            const productmessages = product.querySelector('.product-message')
            // 恢复修改前的信息
            const pname = product.querySelector('.product-name')
            const price = product.querySelector('.price')
            const category = product.querySelector('.category')
            const stock = product.querySelector('.stock')
            pname.innerText = product.dataset.originalName
            price.innerText = `￥${product.dataset.originalPrice}`
            category.innerText = `类别：${product.dataset.originalCategory}`
            stock.innerText = `库存：${product.dataset.originalStock}件`
            product.querySelector('img').src = product.dataset.originalImage
            // 恢复视图
            changemessage.style.display = 'none'
            productmessages.style.display = 'block'
            // 获取产品的选项区域
            const options = product.querySelector('.options')
            options.querySelectorAll('button').forEach(button => {
                const targetClasses = ['changepro', 'deletepro']
                if (targetClasses.some(className => button.classList.contains(className))) {
                    button.style.display = 'block'
                }
                else button.style.display = 'none'
            })
            const requestBody = {
                temporaryimg,
                newimage_url: product.dataset.originalImage
            }
            fetchdatas('/deletenewimg', requestBody)
            temporaryimg = []
        })
    })
}
//删除商品
function deleteproduct(whologin) {
    document.querySelectorAll('.productbox .products .product .options .deletepro').forEach(button => {
        button.addEventListener('click', async function () {
            const product = button.closest('.product')
            try {
                const requestBody = {
                    name: whologin.name,
                    email: whologin.email,
                    proID: product.getAttribute('id'),
                }
                const res = await fetchdatas('/deleteproduct', requestBody)
                if (res.success) {
                    product.remove()
                }
                const message = document.querySelector('#productboxfinishOverlay p')
                message.innerText = res.message
                openModal('productboxfinishOverlay')
            } catch (error) {
                console.error('获取产品数据失败:', error)
            }
        })
    })
}
//添加商品
function addproduct(whologin) {
    let oldImagePath = []
    document.querySelector('.productbox .addproduct').addEventListener('click', function () {
        openModal('productboxaddproductOverlay')
    })
    document.querySelector('.addproduct-box .preview').addEventListener("click", function () {
        document.querySelector('.addproduct-box .imageUpload').click()
    })
    document.querySelector('.addproduct-box .imageUpload').addEventListener("change", function (event) {
        const file = event.target.files[0]
        if (file) {
            const newimg = new FormData()
            newimg.append('image', file)
            fetch('/uploadimg', {
                method: 'POST',
                body: newimg
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        oldImagePath.push(data.filePath)
                        document.querySelector('.addproduct-box .preview').innerHTML = `<img src="${data.filePath}" alt="商品图片">`
                    } else {
                        const message = document.querySelector('#successOverlay p')
                        message.innerText = '商品上传失败'
                        openModal('successOverlay')
                    }
                })
                .catch(error => {
                    console.error('Error:', error)
                })

        }
    })
    document.querySelector('.addproduct-box .buttons .cancel-btn').addEventListener("click", function () {
        document.querySelector('.addproduct-box .imageUpload').value = ""
        document.querySelector('.addproduct-box .preview').innerHTML = "点击上传图片"
        document.querySelector('.addproduct-box .productName').value = ""
        document.querySelector('.addproduct-box .productPrice').value = ""
        document.querySelector('.addproduct-box .productStock').value = ""
        document.querySelector('.addproduct-box .productCategory').selectedIndex = 0
        closeModal('productboxaddproductOverlay')
        const requestBody = {
            temporaryimg: oldImagePath,
            newimage_url: ''
        }
        fetchdatas('/deletenewimg', requestBody)
        oldImagePath = []
    })
    document.querySelector('.addproduct-box .buttons .confirm-btn').addEventListener("click", async function () {
        const productName = document.querySelector('.addproduct-box .productName').value
        const productPrice = parseFloat(document.querySelector('.addproduct-box .productPrice').value)
        const productStock = parseFloat(document.querySelector('.addproduct-box .productStock').value)
        const productCategory = document.querySelector('.addproduct-box .productCategory').value
        const productImage = document.querySelector('.addproduct-box .imageUpload').files.length
        const message = document.querySelector('#productboxfinishOverlay p')
        // 检查商品价格
        if (isNaN(productPrice) || productPrice < 0) {
            document.querySelector('.addproduct-box .productPrice').value = "0"
            message.innerText = '请输入合理的价格'
            openModal('productboxfinishOverlay')
            return
        }
        // 检查库存数量
        if (isNaN(productStock) || productStock < 0) {
            message.innerText = '请输入合理的库存'
            openModal('productboxfinishOverlay')
            document.querySelector('.addproduct-box .productStock').value = "0"
            return
        }
        // 检查是否上传了图片
        if (productImage === 0) {
            message.innerText = '请上传图片'
            openModal('productboxfinishOverlay')
            return
        }
        const image_url = document.querySelector('.addproduct-box .preview img').src
        const requestBody = {
            pname: productName,
            price: productPrice,
            category: productCategory,
            stock: Math.ceil(productStock),
            image_url,
            name: whologin.name,
            email: whologin.email,
            oldImagePath
        }
        const res = await fetchdatas('/addproduct', requestBody)
        message.innerText = res.message
        if (res.success) {
            closeModal('productboxaddproductOverlay')
            oldImagePath = []
            document.querySelector('.addproduct-box .imageUpload').value = ""
            document.querySelector('.addproduct-box .preview').innerHTML = "点击上传图片"
            document.querySelector('.addproduct-box .productName').value = ""
            document.querySelector('.addproduct-box .productPrice').value = ""
            document.querySelector('.addproduct-box .productStock').value = ""
            document.querySelector('.addproduct-box .productCategory').selectedIndex = 0
        }
        openModal('productboxfinishOverlay')
    })
}
//-------------商家订单展示区----------------------------
//请求用户订单数据
async function showShopOrder(offset, limit, page, whologin) {
    try {
        openModal('orderboxloadingOverlay')
        const requestBody = {
            limit,
            offset,
            email: whologin.email,
            name: whologin.name
        }
        const res = await fetchdatas('/showShoporder', requestBody)
        await renderShopOrder(res.data, res.datalength, page, whologin)
        closeModal('orderboxloadingOverlay')
    } catch (error) {
        console.error('获取数据失败:', error)
    }
}
//渲染用户订单
async function renderShopOrder(data, orderslength, page, whologin) {
    const orders = document.querySelector('.orderbox .orders .ordersbody')
    orders.innerHTML = ' '
    if (!data.length || !data) {
        //渲染切换页面按钮
        renderswitchpagebutton(1, 'orderbox', orderslength)
        document.querySelector('.orderboxtop')?.scrollIntoView({ behavior: 'smooth' })
        return
    }
    const fragment = document.createDocumentFragment()
    data.forEach(order => {
        const ord = document.createElement('div')
        ord.classList.add('order')
        ord.setAttribute('id', `${order.OrderId}`)
        ord.innerHTML = `
            <div class="orderhead">
                <div class="useremail">用户邮箱：${order.useremail}</div>
                <div class="orderid">订单编号：${order.OrderId}</div>
                <div class="ordertime">订单时间：${order.Ordertime}</div>
            </div>
            <div class="orderbody">
                <div class="product-message">
                    <img src="${order.image_url}" alt="${order.pname}" class="${order.id}">
                    <div class="pname">${order.pname}</div>
                    <div class="category">类别：${order.category}</div>
                </div>
                <div class="price">￥${order.price}</div>
                <div class="count">${order.count}</div>
                <div class="countmoney">￥${(parseFloat(order.price) * parseInt(order.count)).toFixed(2)}</div>
                <div class="status">${order.status == '1' ? '订单已完成' : '未发货'}</div>
                ${order.status == '1' ? '' : '<button>发货</button>'}
            </div>`
        fragment.appendChild(ord)
    })
    orders.appendChild(fragment)
    //渲染切换页面按钮
    renderswitchpagebutton(page, 'orderbox', orderslength)
    // //点击按钮切换商品页面
    switchOrderbox(whologin)
    //发货
    sendOrder(whologin)
    document.querySelector('.orderboxtop')?.scrollIntoView({ behavior: 'smooth' })

}
//点击按钮切换订单页面
function switchOrderbox(whologin) {
    const switchPageContainer = document.querySelector('.orderbox .switch-page')
    switchPageContainer.replaceWith(switchPageContainer.cloneNode(true))
    const newSwitchPageContainer = document.querySelector('.orderbox .switch-page')
    newSwitchPageContainer.addEventListener('click', function (event) {
        const target = event.target
        const nowPage = Number(document.querySelector('.orderbox .switch-page .active').innerText)
        switch (true) {
            case target.classList.contains('number-page'):
                orderSearch('/SwitchShopOrderbox', Number(target.innerText), whologin)
                break
            case target.classList.contains('before-page') && nowPage > 1:
                orderSearch('/SwitchShopOrderbox', nowPage - 1, whologin)
                break
            case target.classList.contains('next-page'):
                orderSearch('/SwitchShopOrderbox', nowPage + 1, whologin)
                break
        }
    })
}
//搜索框 搜索订单
function ShopsearchOrder(whologin) {
    const searchProductbutton = document.querySelector('.orderbox .searchbox button')
    const searchUserInput = document.querySelector('.orderbox .searchbox input')
    const categorySelect = document.querySelector('.orderbox .searchbox .select-category')
    const statusSelect = document.querySelector('.orderbox .searchbox .select-status')
    searchProductbutton.addEventListener('click', function () {
        orderSearch('/ShopSearchOrder', 1, whologin)
    })
    searchUserInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            orderSearch('/ShopSearchOrder', 1, whologin)
        }
    })
    categorySelect.addEventListener('change', function () {
        orderSearch('/ShopSearchOrder', 1, whologin)
    })
    statusSelect.addEventListener('change', function () {
        orderSearch('/ShopSearchOrder', 1, whologin)
    })
}
//订单筛选 请求数据
async function orderSearch(url, pageNum, whologin) {
    const searchUserInput = document.querySelector('.orderbox .searchbox input')
    const categorySelect = document.querySelector('.orderbox .searchbox .select-category')
    const statusSelect = document.querySelector('.orderbox .searchbox .select-status')
    //搜索的类型
    const inputSelect = document.querySelector('.orderbox .searchbox .select-input')
    const query = searchUserInput.value.trim()
    const selectedCategory = categorySelect.value
    const selectedInput = inputSelect.value
    const selectedstatus = statusSelect.value
    const offset = (pageNum - 1) * 10
    const limit = 10
    // 如果既没输入内容，又选择了 "全部"，就查询所有订单
    if (!query && selectedCategory === '全部' && selectedstatus === '全部') {
        await showShopOrder(offset, limit, pageNum, whologin)
        return
    }
    const requestBody = {
        searchUserinput: query,
        category: selectedCategory,
        selectedInput,
        selectedstatus,
        email: whologin.email,
        name: whologin.name,
        offset,
        limit
    }
    const res = await fetchdatas(url, requestBody)
    renderShopOrder(res.data, res.datalength, pageNum, whologin)
}
//发货
function sendOrder(whologin) {
    document.querySelectorAll('.orderbox .orders .ordersbody .order .orderbody button').forEach(button => {
        button.addEventListener('click', async function () {
            const order = button.closest('.order')
            const orderid = order.querySelector('.orderid').innerText.split('：')[1]?.trim()
            const useremail = order.querySelector('.useremail').innerText.split('：')[1]?.trim()
            const pname = order.querySelector('.pname').innerText
            const orderstatus = order.querySelector('.status')
            try {
                const requestBody = {
                    name: whologin.name,
                    email: whologin.email,
                    orderid,
                    useremail,
                    pname
                }
                const res = await fetchdatas('/sendOrder', requestBody)
                document.querySelector('#orderboxfinishOverlay p').innerText = res.message
                if (res.success) {
                    orderstatus.innerText = '订单已完成'
                    button.remove()
                }
                openModal('orderboxfinishOverlay')
            } catch (error) {
                console.error('获取产品数据失败:', error)
            }
        })
    })
}
//-------------图像展示区------------------------
let SchartA, SchartB, SchartC;
//获取销售数据
async function showShopChart(whologin) {
    const requestBody = {
        email: whologin.email,
        name: whologin.name,
    }
    const data = await fetchdatas('/shopSalesData', requestBody)
    shoprenderCharts(data)
    // 监听窗口大小变化，重新渲染图表
    window.addEventListener('resize', () => shoprenderCharts(data))
}
//渲染图表
function shoprenderCharts(data) {
    const categoryChart = document.querySelector('.categoryChart')
    const sevendayChart = document.querySelector('.sevendayChart')
    const productChart = document.querySelector('.productChart')
    const dpr = window.devicePixelRatio < 1.25 ? 1.25 : window.devicePixelRatio
    categoryChart.width = categoryChart.offsetWidth * dpr
    categoryChart.height = categoryChart.offsetHeight * dpr
    sevendayChart.width = sevendayChart.offsetWidth * dpr
    sevendayChart.height = sevendayChart.offsetHeight * dpr
    productChart.width = productChart.offsetWidth * dpr
    productChart.height = productChart.offsetHeight * dpr
    // 获取上下文
    const categoryChartCtx = categoryChart.getContext('2d')
    const sevendayChartCtx = sevendayChart.getContext('2d')
    const productChartCtx = productChart.getContext('2d')
    // 如果已经有图表实例，销毁它
    if (SchartA) {
        SchartA.destroy()
    }
    if (SchartB) {
        SchartB.destroy()
    }
    if (SchartC) {
        SchartC.destroy()
    }
    //各个商品类别销售图
    SchartA = new Chart(categoryChartCtx, {
        type: 'bar',
        data: {
            labels: data.categories.categories, // x轴的类别
            datasets: [
                {
                    label: '销售量', // 左侧 Y 轴
                    data: data.categories.totalCounts, // 销售量数据
                    backgroundColor: 'rgba(54, 235, 75, 0.6)',
                    yAxisID: 'y-axis-left' // 绑定到左侧 Y 轴
                },
                {
                    label: '销售总额', // 右侧 Y 轴
                    data: data.categories.totalSales, // 销售总额数据
                    backgroundColor: 'rgba(255, 80, 64, 0.6)',
                    yAxisID: 'y-axis-right' // 绑定到右侧 Y 轴
                }
            ]

        },
        options: {
            responsive: false,
            plugins: {
                datalabels: {
                    anchor: 'start',  // 数据标签的位置（末端）
                    align: 'top',   // 数据标签对齐方式（上方）
                    font: {
                        size: 18      // 标签字体大小
                    },
                    color: 'black',  // 标签字体颜色
                    offset: 0,  // 调整数据标签与柱子的间距，避免重叠
                    formatter: (value) => value // 显示数据值
                },
                legend: {
                    position: 'top',  // 将图例移到顶部
                    labels: {
                        font: { size: 22 }
                    },
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-left': {
                    position: 'left',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-right': {
                    position: 'right',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                }
            },

        }
    })

    //30天内销售图
    SchartB = new Chart(sevendayChartCtx, {
        type: 'line',
        data: {
            labels: data.sevenday.dates,
            datasets: [
                {
                    label: '销售量趋势',
                    data: data.sevenday.totalCounts,
                    borderColor: 'blue',
                    fill: false,
                    yAxisID: 'y-axis-left',
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        font: {
                            size: 18
                        },

                        color: 'black',
                        formatter: (value) => value
                    }
                },
                {
                    label: '销售总额趋势',
                    data: data.sevenday.totalSales,
                    borderColor: 'rgba(255, 159, 64, 0.6)',
                    fill: false,
                    yAxisID: 'y-axis-right',
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        font: {
                            size: 18
                        },

                        color: 'black',
                        formatter: (value) => value
                    }
                }
            ]
        },
        options: {
            responsive: false,
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        },
                        padding: 30
                    },
                    offset: true
                },
                'y-axis-left': {
                    position: 'left',
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-right': {
                    position: 'right',
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 18
                        }
                    }, offset: true
                },
                tooltip: {
                    titleFont: {
                        size: 18
                    },
                    bodyFont: {
                        size: 18
                    }
                }
            }
        }
    })
    //各个商品类别销售图
    SchartC = new Chart(productChartCtx, {
        type: 'bar',
        data: {
            labels: data.product.id, // x轴的类别
            datasets: [
                {
                    label: '销售量', // 左侧 Y 轴
                    data: data.product.totalCounts, // 销售量数据
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    yAxisID: 'y-axis-left' // 绑定到左侧 Y 轴
                }
            ]
        },
        options: {
            responsive: false,
            plugins: {
                datalabels: {
                    anchor: 'start',  // 数据标签的位置（末端）
                    align: 'top',   // 数据标签对齐方式（上方）
                    font: {
                        size: 18      // 标签字体大小
                    },
                    color: 'black',  // 标签字体颜色
                    offset: 0,  // 调整数据标签与柱子的间距，避免重叠
                    formatter: (value) => value // 显示数据值
                },
                legend: {
                    position: 'top',  // 将图例移到顶部
                    labels: {
                        font: { size: 22 }
                    },
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 18
                        }
                    }
                },
                'y-axis-left': {
                    position: 'left',
                    ticks: {
                        beginAtZero: true,
                        font: {
                            size: 18
                        }
                    }
                }
            }
        }
    })
}
