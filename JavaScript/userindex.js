function userindexfunction() {
    const whologin = indexgetUser()
    showUserProduct(0, 40, 1, whologin).then(() => {
        if (whologin.who == 'nobody') {
            searchProduct(whologin)

        }
        if (whologin.who == 'user') {
            //用户导航栏
            usernav(whologin)
            logout(whologin)
            openANDcloseBox(whologin)
            //搜索主页商品
            searchProduct(whologin)
            //搜索订单
            UsersearchOrder(whologin)
            //搜索购物车
            UsersearchCart(whologin)
            //结算
            checkoutproduct(whologin)
        }
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
function indexgetUser() {
    let urlParams = new URLSearchParams(window.location.search)
    let whologin = {
        who: urlParams.get('who') ? urlParams.get('who') : 'nobody',
        name: urlParams.get('name'),
        email: urlParams.get('email')
    }
    return whologin
}
function banbutton() {
    const addcart = document.querySelector('.oneproductbox button.addcart');
    addcart.addEventListener('click', function () {
        document.querySelector('#oneproductboxfinishOverlay p').innerText = '请先登录'
        openModal('oneproductboxfinishOverlay')
    })
}
//--------------导航栏操作------------------
//显示导航栏
async function usernav(whologin) {
    const login = document.querySelector('.navbox .login')
    const register = document.querySelector('.navbox .register')
    const goproductbox = document.querySelector('.navbox .goproductbox')
    const gocartbox = document.querySelector('.navbox .gocartbox')
    const goorderbox = document.querySelector('.navbox .goorderbox')
    const logout = document.querySelector('.navbox .logout')
    const username = document.querySelector('.productbox .searchbox .usermessage .username')
    if (whologin.name) {
        username.innerText = `${whologin.name}，欢迎回来`
    }
    login.style.display = 'none'
    register.style.display = 'none'
    goproductbox.style.display = 'block'
    gocartbox.style.display = 'block'
    goorderbox.style.display = 'block'
    logout.style.display = 'block'
    goproductbox.classList.add('active')

}
//更新用户余额
async function updateusermoney(whologin) {
    const usermoney = document.querySelector('.productbox .searchbox .usermessage .usermoney')
    const res = await fetchdatas('/usernav', { Email: whologin.email })
    usermoney.innerText = `您的余额：￥${res.data.umoney}`
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
        const beOpenBox = event.target.closest('.goproductbox, .gocartbox, .goorderbox')?.classList[0]
        if (!beOpenBox || activeElement.classList.contains(beOpenBox)) return
        const activeBoxId = activeElement.classList[0]
        //关闭当前的box
        switch (activeBoxId) {
            case 'goproductbox':
                document.querySelector('.oneproductbox').classList.remove('active')
                break
            case 'gocartbox':
                resetcartbox()
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
        //对应的box查询展示对应的数据
        const actionMap = {
            'goproductbox': async () => await showUserProduct(0, 40, 1, whologin),
            'gocartbox': async () => await showUserCart(whologin),
            'goorderbox': async () => await showUserOrder(0, 10, 1, whologin)
        }
        await actionMap[beOpenBox]?.()
    })
}
//------------------------------------
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
        default:
            placeholderText = '请输入内容'
    }
    input.placeholder = placeholderText
    selectcategory.style.display = (value == 'pname') ? 'block' : 'none'
}
//--------------商品展示区----------------------
//读取商品
async function showUserProduct(offset, limit, page, whologin) {
    try {
        openModal('productboxloadingOverlay')
        const requestBody = {
            offset,
            limit,
            email: whologin.email
        }
        const res = await fetchdatas('/showUserProduct', requestBody)
        await renderUserProduct(res.products, res.productslength, page, whologin)
        closeModal('productboxloadingOverlay')
    } catch (error) {
        console.error('获取数据失败:', error)
    }
}
//渲染用户主页商品
async function renderUserProduct(data, productslength, page, whologin) {
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
            <div>
                <div class="product-name">${product.pname}</div>
                <div class="category">类别: ${product.category}</div>
                <div class="price">¥${product.price}</div>
                <div class="stock">库存: ${product.stock}件</div>
                <div class="store">${product.shopname}</div>
            </div>`
        fragment.appendChild(pro)
    })
    products.appendChild(fragment)
    //更新用户余额
    if (whologin.email) {
        updateusermoney(whologin)
    }
    //渲染切换页面按钮
    renderswitchpagebutton(page, 'productbox', productslength)
    // //单独查看商品
    GOoneProductbox(whologin)
    // //点击按钮切换商品页面
    switchproductbox(whologin)
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
                productSearch('/SwitchUserProductbox', Number(target.innerText), whologin)
                break
            case target.classList.contains('before-page') && nowPage > 1:
                productSearch('/SwitchUserProductbox', nowPage - 1, whologin)
                break
            case target.classList.contains('next-page'):
                productSearch('/SwitchUserProductbox', nowPage + 1, whologin)
                break
        }
    })
}
//商品筛选
async function productSearch(url, pageNum, whologin) {
    const searchUserInput = document.querySelector('.productbox .searchbox input')
    const categorySelect = document.querySelector('.productbox .searchbox .select-category')
    const inputSelect = document.querySelector('.productbox .searchbox .select-input')
    const query = searchUserInput.value.trim()
    const selectedCategory = categorySelect.value
    const selectedInput = inputSelect.value
    const offset = (pageNum - 1) * 40
    const limit = 40
    // 如果既没输入内容，又选择了 "全部"，就查询所有购物车商品
    if (!query && selectedCategory === '全部') {
        await showUserProduct(offset, limit, pageNum, whologin)
        return
    }
    const requestBody = {
        searchUserinput: query,
        category: selectedCategory,
        selectedInput,
        email: whologin.email,
        name: whologin.name,
        offset,
        limit
    }
    const res = await fetchdatas(url, requestBody)
    renderUserProduct(res.data, res.productslength, pageNum, whologin)
}
//搜索商品
function searchProduct(whologin) {
    const searchProductbutton = document.querySelector('.productbox .searchbox button')
    const searchUserInput = document.querySelector('.productbox .searchbox input')
    const categorySelect = document.querySelector('.productbox .searchbox .select-category')
    searchProductbutton.addEventListener('click', function () {
        productSearch('/UserSearchProduct', 1, whologin)
    })
    searchUserInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            productSearch('/UserSearchProduct', 1, whologin)
        }
    })
    categorySelect.addEventListener('change', function () {
        productSearch('/UserSearchProduct', 1, whologin)
    })
}
//---------------购物车展示区---------------------
//请求用户购物车数据
async function showUserCart(whologin) {
    try {
        openModal('cartboxloadingOverlay')
        const requestBody = {
            email: whologin.email,
            name: whologin.name
        }
        const res = await fetchdatas('/showUsercart', requestBody)
        await renderUserCart(res.data, whologin)
        closeModal('cartboxloadingOverlay')
    } catch (error) {
        console.error('获取数据失败:', error)
    }
}
//渲染用户购物车
async function renderUserCart(carts, whologin) {
    const cartBody = document.querySelector('.cartbox .carts .cartsbody');
    cartBody.innerHTML = ' '
    if (!carts || carts.length == 0) return
    const fragment = document.createDocumentFragment()
    const shopMap = new Map()
    carts.forEach(cart => {
        if (!shopMap.has(cart.shopemail)) {
            const shop = document.createElement('div')
            shop.classList.add('cartshop')
            shop.innerHTML = `
            <div class="cartshophead">
                <input type="checkbox" class="select selectshop"></input>
                <div class="shop ${cart.shopemail}">${cart.shopname}</div>
            </div>
            <div class="cartshopbody">
            </div>`
            shopMap.set(cart.shopemail, shop)
        }
        const shop = shopMap.get(cart.shopemail);
        const cartdiv = document.createElement('div')
        cartdiv.classList.add('cart')
        cartdiv.innerHTML = `
            <input type="checkbox" class="select selectproduct"></input>
            <div class="product-message">
                <img src="${cart.image_url}" alt="${cart.pname}" class="${cart.id}">
                <div class="pname">${cart.pname}</div>
                <div class="category">类别：${cart.category}</div>
                <div class="stock">库存：${cart.stock}件</div>
            </div>
            <div class="price">￥${cart.price}</div>
            <input type="number" value="${cart.count}" class="count"></input>
            <div class="countmoney">￥${(parseFloat(cart.count) * parseFloat(cart.price)).toFixed(2)}</div>
            <button>删除</button>`
        shop.querySelector('.cartshopbody').appendChild(cartdiv)
    })
    shopMap.forEach(shop => fragment.appendChild(shop))
    cartBody.appendChild(fragment)
    cartgoproduct(whologin)
    deletecart(whologin)
    updatecartcount(whologin)
    CartSelection()
}
//删除购物车商品
function deletecart(whologin) {
    const deletebuttons = document.querySelectorAll('.cartbox .carts .cartsbody .cart button')
    deletebuttons.forEach(button => {
        button.addEventListener('click', async function () {
            const cartshop = button.closest('.cartshop')
            const cart = button.closest('.cart')
            const cartshopbody = button.closest('.cartshopbody')
            const proID = cart.querySelector('.product-message img').className.trim()
            try {
                openModal('cartboxloadingOverlay')
                const requestBody = {
                    email: whologin.email,
                    name: whologin.name,
                    proID
                }
                const res = await fetchdatas('/deletecart', requestBody)
                if (res.success) {
                    cartshopbody.removeChild(cart)
                    if (cartshopbody.children.length == 0) {
                        cartshop.remove()
                    }
                }
                closeModal('cartboxloadingOverlay')
                document.querySelector('#cartboxfinishOverlay p').innerText = res.message
                openModal('cartboxfinishOverlay')
            } catch (error) {
                console.error('获取数据失败:', error)
            }
        })
    })
}
//点击图片跳转商品页面
function cartgoproduct(whologin) {
    const products = document.querySelectorAll('.cartbox .cartsbody .cartshop .cart .product-message img')
    products.forEach(product => {
        product.addEventListener('click', async function () {
            const productID = product.className.trim()
            document.getElementById('gocartbox').classList.remove('active')
            document.getElementById('oneproductbox')?.classList.add('active')
            document.querySelector('.gocartbox').classList.remove('active')
            document.querySelector('.goproductbox').classList.add('active')
            resetcartbox()
            try {
                openModal('oneproductboxloadingOverlay')
                const requestBody = {
                    proID: productID,
                    email: whologin.email
                }
                const res = await fetchdatas('/showOneProduct', requestBody)
                await renderOneProduct(res.data, res.ifincart, whologin)
                closeModal('oneproductboxloadingOverlay')
            } catch (error) {
                console.error('获取数据失败:', error)
            }
        })
    })
}
//搜索框 
function UsersearchCart(whologin) {
    const searchProductbutton = document.querySelector('.cartbox .searchbox .searchbutton')
    const searchUserInput = document.querySelector('.cartbox .searchbox input')
    const categorySelect = document.querySelector('.cartbox .searchbox .select-category')
    searchProductbutton.addEventListener('click', function () {
        cartSearch('/UsersearchCart', whologin)
    })
    searchUserInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            cartSearch('/UsersearchCart', whologin)
        }
    })
    categorySelect.addEventListener('change', function () {
        cartSearch('/UsersearchCart', whologin)
    })
}
//搜索购物车商品
async function cartSearch(url, whologin) {
    const searchUserInput = document.querySelector('.cartbox .searchbox input')
    const categorySelect = document.querySelector('.cartbox .searchbox .select-category')
    //搜索的类型
    const inputSelect = document.querySelector('.cartbox .searchbox .select-input')
    const query = searchUserInput.value.trim()
    const selectedCategory = categorySelect.value
    const selectedInput = inputSelect.value
    // 如果既没输入内容，又选择了 "全部"，就查询所有购物车商品
    if (!query && selectedCategory === '全部') {
        await showUserCart(whologin)
        return
    }
    const requestBody = {
        searchUserinput: query,
        category: selectedCategory,
        selectedInput,
        email: whologin.email,
        name: whologin.name,
    }
    const res = await fetchdatas(url, requestBody)
    renderUserCart(res.data, whologin)
}
// 购物车商品数量更改
function updatecartcount(whologin) {
    document.querySelectorAll('.cartbox .carts .cart .count').forEach(countInput => {
        let debounceTimer
        countInput.addEventListener('input', () => {
            clearTimeout(debounceTimer) // 清除上一次的定时器
            let currentValue = Math.max(1, parseInt(countInput.value, 10) || 1)
            if (currentValue > 10000) {
                document.querySelector('#cartboxfinishOverlay p').innerText = '最多可添加10000件'
                countInput.value = 10000
                currentValue = 10000
                openModal('cartboxfinishOverlay')
            }
            const cart = countInput.closest('.cart')
            const countmoney = cart.querySelector('.countmoney')
            const price = parseFloat(cart.querySelector('.price').textContent.replace(/[^\d.]/g, '')) || 0
            const productId = cart.querySelector('.product-message img').className
            countmoney.innerText = (currentValue * price).toFixed(2)
            checkoutBar()
            debounceTimer = setTimeout(async () => {
                try {
                    const requestBody = {
                        name: whologin.name,
                        email: whologin.email,
                        proID: productId,
                        count: currentValue
                    }
                    await fetchdatas('/updatecartcount', requestBody)
                } catch (error) {
                    console.error('获取数据失败:', error)
                }
            }, 1000)
        })
    })
}
//结算栏的数字变换
function checkoutBar() {
    const selectedmoney = document.querySelector('.cartbox .checkout .totalmoney')
    const selectedcount = document.querySelector('.cartbox .checkout .totalcount')
    let totalmoney = 0
    let totalcount = 0
    const selectedCheckboxes = document.querySelectorAll('.cartbox .selectproduct[type="checkbox"]:checked').forEach(checkbox => {
        const cart = checkbox.closest('.cart')
        const countmoney = parseFloat(cart.querySelector('.countmoney').textContent.replace(/[^\d.]/g, '')) || 0
        const count = Math.max(1, parseInt(cart.querySelector('.count')?.value, 10) || 1)
        totalmoney += countmoney
        totalcount += count
    })
    selectedmoney.innerText = `共计：￥${totalmoney.toFixed(2)}`
    selectedcount.innerText = `已选：${totalcount}件`
}
//选择框
function CartSelection() {
    // 获取所有的选择框
    const selectAll = document.querySelector('.cartbox .carts .selectall')
    const cartshops = document.querySelectorAll('.cartbox .carts .cartshop')
    if (!selectAll || cartshops.length === 0) return
    // 全选框逻辑
    selectAll.addEventListener('change', () => {
        const checked = selectAll.checked
        cartshops.forEach(cartshop => {
            const shopCheckbox = cartshop.querySelector('.selectshop')
            const productCheckboxes = cartshop.querySelectorAll('.selectproduct')
            if (shopCheckbox) shopCheckbox.checked = checked
            productCheckboxes.forEach(p => p.checked = checked)
        })
        checkoutBar()
    })
    // 每个店铺的逻辑
    cartshops.forEach(cartshop => {
        const shopCheckbox = cartshop.querySelector('.selectshop')
        const productCheckboxes = cartshop.querySelectorAll('.selectproduct')
        if (!shopCheckbox || productCheckboxes.length === 0) return
        // 店铺全选框 → 商品联动
        shopCheckbox.addEventListener('change', () => {
            const checked = shopCheckbox.checked
            productCheckboxes.forEach(p => p.checked = checked)
            updateSelectAllState()
            checkoutBar()
        })
        // 商品选择框 → 店铺/全选框联动
        productCheckboxes.forEach(p => {
            p.addEventListener('change', () => {
                const allChecked = Array.from(productCheckboxes).every(p => p.checked)
                shopCheckbox.checked = allChecked
                updateSelectAllState()
                checkoutBar()
            })
        })
    })

    // 更新全选框的状态（根据所有商店是否全选）
    function updateSelectAllState() {
        const allShopsChecked = Array.from(cartshops).every(cartshop => {
            const shopCheckbox = cartshop.querySelector('.selectshop')
            return shopCheckbox && shopCheckbox.checked
        })
        selectAll.checked = allShopsChecked
    }
}
//重置购物车初始设置
function resetcartbox() {
    const selectedmoney = document.querySelector('.cartbox .checkout .totalmoney')
    const selectedcount = document.querySelector('.cartbox .checkout .totalcount')
    selectedmoney.innerText = `共计：￥0.00`
    selectedcount.innerText = `已选：0件`
    const selectAll = document.querySelector('.cartbox .carts .selectall')
    selectAll.checked = false
}
//购买商品
async function checkoutproduct(whologin) {
    document.querySelector('.cartbox .checkout .checkoutbutton').addEventListener('click', async function () {
        const message = document.querySelector('#cartboxfinishOverlay p')
        const selectproducts = Array.from(document.querySelectorAll('.cartbox .selectproduct'))
            .filter(checkbox => checkbox.checked)
        if (selectproducts.length === 0) {
            message.innerText = '请选择商品'
            openModal('cartboxfinishOverlay')
            return
        }
        const selectedProducts = []
        selectproducts.forEach(select => {
            const cart = select.closest('.cart')
            const cartshop = select.closest('.cartshop')
            const shopemail = cartshop.querySelector('.cartshophead .shop').classList[1]
            const shopname = cartshop.querySelector('.cartshophead .shop').innerText.trim()
            const pname = cart.querySelector('.product-message .pname').innerText.trim()
            const category = cart.querySelector('.product-message .category').innerText.trim().split('：')[1]?.trim()
            const price = parseFloat(cart.querySelector('.price').textContent.replace(/[^\d.]/g, '')) || 0
            const proID = cart.querySelector('.product-message img').className
            const image_url = cart.querySelector('.product-message img').src
            const count = parseInt(cart.querySelector('.count')?.value || '1', 10)
            selectedProducts.push({ pname, category, price, proID, count, image_url, shopemail, shopname })
        })
        openModal('cartboxloadingOverlay')
        try {
            const requestBody = {
                name: whologin.name,
                email: whologin.email,
                selectedProducts
            }
            const res = await fetchdatas('/checkoutproduct', requestBody)
            closeModal('cartboxloadingOverlay')
            if (res.success) {
                await showUserCart(whologin)
                resetcartbox()
                const usermoney = document.querySelector('.productbox .searchbox .usermessage .usermoney')
                usermoney.innerText = `您的余额：￥${parseFloat(res.newBalance).toFixed(2)}`
            }
            message.innerText = res.message
            openModal('cartboxfinishOverlay')
        } catch (error) {
            console.error('获取数据失败:', error)
        }
    })
}
//---------------订单展示区---------------------
//请求用户订单数据
async function showUserOrder(offset, limit, page, whologin) {
    try {
        openModal('orderboxloadingOverlay')
        const requestBody = {
            limit,
            offset,
            email: whologin.email,
            name: whologin.name
        }
        const res = await fetchdatas('/showUserorder', requestBody)
        await renderUserOrder(res.data, res.datalength, page, whologin)
        closeModal('orderboxloadingOverlay')
    } catch (error) {
        console.error('获取数据失败:', error)
    }
}
//渲染用户订单
async function renderUserOrder(data, orderslength, page, whologin) {
    const orders = document.querySelector('.orderbox .orders .ordersbody')
    orders.innerHTML = ' '
    if (!data.length || !data) {
        //渲染切换页面按钮
        renderswitchpagebutton(1, 'orderbox', orderslength)
        //点击按钮切换商品页面
        // switchOrderbox(whologin)
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
                <div class="shop">店铺：${order.shopname}</div>
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
                <div class="status">${order.status == '1' ? '已发货' : '未发货'}</div>
                <button>x</button>
            </div>`
        fragment.appendChild(ord)
    })
    orders.appendChild(fragment)
    //渲染切换页面按钮
    renderswitchpagebutton(page, 'orderbox', orderslength)
    // //单独查看商品
    ordergoproduct(whologin)
    // //点击按钮切换商品页面
    switchOrderbox(whologin)
    deleteorder(whologin)
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
                orderSearch('/SwitchUserOrderbox', Number(target.innerText), whologin)
                break
            case target.classList.contains('before-page') && nowPage > 1:
                orderSearch('/SwitchUserOrderbox', nowPage - 1, whologin)
                break
            case target.classList.contains('next-page'):
                orderSearch('/SwitchUserOrderbox', nowPage + 1, whologin)
                break
        }
    })
}
//搜索框 搜索订单
function UsersearchOrder(whologin) {
    const searchProductbutton = document.querySelector('.orderbox .searchbox button')
    const searchUserInput = document.querySelector('.orderbox .searchbox input')
    const categorySelect = document.querySelector('.orderbox .searchbox .select-category')
    const statusSelect = document.querySelector('.orderbox .searchbox .select-status')
    searchProductbutton.addEventListener('click', function () {
        orderSearch('/UserSearchOrder', 1, whologin)
    })
    searchUserInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            orderSearch('/UserSearchOrder', 1, whologin)
        }
    })
    categorySelect.addEventListener('change', function () {
        orderSearch('/UserSearchOrder', 1, whologin)
    })
    statusSelect.addEventListener('change', function () {
        orderSearch('/UserSearchOrder', 1, whologin)
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
        await showUserOrder(offset, limit, pageNum, whologin)
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
    renderUserOrder(res.data, res.datalength, pageNum, whologin)
}
//删除历史订单
function deleteorder(whologin) {
    const deletebuttons = document.querySelectorAll('.orderbox .orders .order button')
    deletebuttons.forEach(button => {
        button.addEventListener('click', async function () {
            const order = button.closest('.order')
            const status = order.querySelector('.status').innerText
            const message = document.querySelector(' #orderboxfinishOverlay p')
            if (status === '未发货') {
                message.innerText = `订单未发货，无法删除`
                openModal('orderboxfinishOverlay')
                return
            }
            openModal('orderboxloadingOverlay')
            const orderIdElement = order.querySelector('.orderid')
            const OrderId = orderIdElement.textContent.replace('订单编号：', '').trim()
            const requestBody = {
                OrderId
            }
            const res = await fetchdatas('deleteorder', requestBody)
            message.innerText = res.message
            if (res.success) {
                document.querySelector('.orderbox .orders .ordersbody').removeChild(order)
            }
            openModal('orderboxfinishOverlay')
            closeModal('orderboxloadingOverlay')
        })
    })
}
//订单点击查看商品详情
function ordergoproduct(whologin) {
    const products = document.querySelectorAll('.orderbox .orders .ordersbody .order .product-message img')
    products.forEach(product => {
        product.addEventListener('click', async function () {
            const productID = product.className.trim()
            document.getElementById('goorderbox').classList.remove('active')
            document.getElementById('oneproductbox')?.classList.add('active')
            document.querySelector('.goorderbox').classList.remove('active')
            document.querySelector('.goproductbox').classList.add('active')
            try {
                openModal('oneproductboxloadingOverlay')
                const requestBody = {
                    proID: productID,
                    email: whologin.email
                }
                const res = await fetchdatas('/showOneProduct', requestBody)
                await renderOneProduct(res.data, res.ifincart, whologin)
                closeModal('oneproductboxloadingOverlay')
            } catch (error) {
                console.error('获取数据失败:', error)
            }
        })
    })
}
//---------------单独商品展示区---------------------
//点击单个商品去往单独商品页面
function GOoneProductbox(whologin) {
    const products = document.querySelectorAll('.productbox .product')
    products.forEach(product => {
        product.addEventListener('click', async function () {
            const productID = product.getAttribute('id').trim()
            document.getElementById('goproductbox').classList.remove('active')
            document.getElementById('oneproductbox')?.classList.add('active')
            try {
                openModal('oneproductboxloadingOverlay')
                const requestBody = {
                    proID: productID,
                    email: whologin.email
                }
                const res = await fetchdatas('/showOneProduct', requestBody)
                await renderOneProduct(res.data, res.ifincart, whologin)
                closeModal('oneproductboxloadingOverlay')
            } catch (error) {
                console.error('获取数据失败:', error)
            }
        })
    })
}
//渲染单个商品
async function renderOneProduct(data, ifincart, whologin) {
    const oldoneproduct = document.querySelector('.oneproductbox .oneproduct')
    oldoneproduct.remove()
    const oneproductbox = document.querySelector('.oneproductbox')
    if (!data) return
    const oneproduct = document.createElement('div')
    oneproduct.classList.add('oneproduct')
    oneproduct.setAttribute('id', `${data.id}`)
    oneproduct.innerHTML = `
           <div class="oneproducthead">
                <button>返回</button>
                <div class="shopname">${data.shopname}</div>
            </div>
            <div class="oneproductbody">
                <div class="oneproductbodyleft">
                    <img src="${data.image_url}" alt="${data.panme}">
                </div>
                <div class="oneproductbodyright">
                    <div class="pname">${data.pname}</div>
                    <div class="price">￥${data.price}</div>
                    <div class="category">类别：${data.category}</div>
                    <div class="stock">库存：${data.stock}件</div>
                    <button class="addcart" ${ifincart ? 'disabled=true' : ''}>${ifincart ? '商品已加入购物车' : '加入购物车'}</button>
                </div>
            </div>`
    oneproductbox.appendChild(oneproduct)
    gobackproductbox()
    if (!whologin.email) {
        banbutton()
        return
    }
    productstaytime(whologin)
    addincart(whologin)
}
//返回商品主页
function gobackproductbox() {
    document.querySelector('.oneproduct .oneproducthead button').addEventListener('click', function () {
        document.getElementById('goproductbox').classList.add('active')
        document.getElementById('oneproductbox')?.classList.remove('active')
    })
}
//添加购物车
function addincart(whologin) {
    const addcart = document.querySelector('.oneproduct .oneproductbody .addcart')
    addcart.addEventListener('click', async function () {
        openModal("oneproductboxloadingOverlay")
        const productID = document.querySelector('.oneproduct').getAttribute('id').trim()
        const requestBody = {
            proID: productID,
            email: whologin.email,
            name: whologin.name
        }
        const res = await fetchdatas('/addincart', requestBody)
        document.querySelector('#oneproductboxfinishOverlay p').innerText = res.message
        closeModal("oneproductboxloadingOverlay")
        openModal("oneproductboxfinishOverlay")
        if (res.success) {
            addcart.innerText = '商品已加入购物车';
            addcart.setAttribute('disabled', 'true')
        }
    })
}
// 存储上一次的监听引用
let prevVisibilityHandler = null
let prevUnloadHandler = null
let prevObserver = null
//记录停留时长
function productstaytime(whologin) {
    const oneproductbox = document.querySelector('.oneproductbox')
    const oneproduct = oneproductbox.querySelector('.oneproduct')
    let startTime = null
    let totaltime = 0
    // 清除旧的监听器
    if (prevVisibilityHandler) {
        document.removeEventListener("visibilitychange", prevVisibilityHandler)
    }
    if (prevUnloadHandler) {
        window.removeEventListener("beforeunload", prevUnloadHandler)
    }
    if (prevObserver) {
        prevObserver.disconnect()
    }
    function startTracking() {
        if (oneproductbox.classList.contains('active')) {
            startTime = Date.now()
        }
    }
    function stopTracking() {
        if (startTime) {
            totaltime += (Date.now() - startTime) / 1000
            startTime = null
        }
    }
    // 页面可见性变化监听
    prevVisibilityHandler = () => {
        if (document.visibilityState === "visible") {
            startTracking()
        } else {
            stopTracking()
        }
    }
    document.addEventListener("visibilitychange", prevVisibilityHandler)
    // 监听窗口关闭事件
    prevUnloadHandler = async () => {
        stopTracking()
        const requestBody = {
            email: whologin.email,
            name: whologin.name,
            proID: oneproduct.getAttribute('id'),
            staytime: totaltime.toFixed(2)
        }
        await fetchdatas('/productstaytime', requestBody)
    }
    window.addEventListener("beforeunload", prevUnloadHandler)
    // 监听类名变化
    prevObserver = new MutationObserver(async mutations => {
        for (let mutation of mutations) {
            if (mutation.attributeName === 'class') {
                if (!oneproductbox.classList.contains('active')) {
                    stopTracking();
                    const requestBody = {
                        email: whologin.email,
                        name: whologin.name,
                        proID: oneproduct.getAttribute('id'),
                        staytime: totaltime.toFixed(2)
                    }
                    await fetchdatas('/productstaytime', requestBody)
                }
            }
        }
    })
    prevObserver.observe(oneproductbox, { attributes: true })
    // 页面加载时开始计时
    startTracking()
}