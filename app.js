const app = Vue.createApp({
    data(){
        return{
            showSignLoginModal : false,
            showCreateAccountModal : false,
            enteredProductTitle : '',
            ecommerceData : [],
            allProductData: [],
            filteredProducts :[],
            viewMode: 'grid',
            productCategory:[],
            selectedCategory: '',
            sortOrder: '',
            currentPage: 1,
            productPerPage : 6,
            totalPages: 0,
            suggestionProduct : [],
            filtersApplied: false,
            debounceTimeout : null,
            abortController : null,
            wishListButtonText : 'Add to wishlist',
            showAlertModal : false,
            alreadyProductAlertModal : false,



            // function copied from details.js - line 27 to 47

            productInfo : null,
            productId : null,
            enteredProductTitle : '',
            // errorMessage : '',
            InputSuggestionProduct : [],
            placeholder : 1,
            itemToMove : null,
            cart:[],
            wishList : [],
            cartButtonText : 'Add to cart',
            saveButtonText : 'Save',
            myCartVisible : false,
            myWishListVisible : false,
            isInWishList : false,
            showAlertModal: false,
            modalMessage : '',
            similarProducts : [],
            activeTab : 1,
            showReviewModal : false,
            currentRating : 0,
            userReviewList : [],

        }
    },
     mounted(){
        this.allProducts();
        this.getCategory();
        


        // function copied from details.js - line 57 to 65
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id');

        console.log('Product ID from URL:', this.productId);

        // this.loadReviewFirst();

        this.fetchProductDetails();
        this.loadCartFromLocalStorage();



    },

    // copied functions from product_details.js from line 73 to 91

    computed: {

        totalPrice(){
            return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        },
        totalDicountPrice(){
            return this.cart.reduce((discountSum, item) => discountSum + item.discountPrice * item.quantity, 0)
        },
        // check the total number of items in the cart
        cartItemCount() {
            return this.cart.reduce((count, item) => count + item.quantity, 0);
        },
        totalProductCount(){
            return this.cart.length;
        },
        totalWishListCount(){
            return this.wishList.length;
        },
    },

    methods:{
        signIn(){
            this.showSignLoginModal = true;
        },
        createAccount(){
            this.showCreateAccountModal = true;
        },

        async allProducts(){
            
            try{
                const response = await fetch(`https://dummyjson.com/products`);
                // console.log(response)
                const data = await response.json();
                this.ecommerceData = data.products;
                // console.log("all data in index.html", this.ecommerceData)
                this.allProductData = [...this.ecommerceData]
                this.totalPages = Math.ceil(this.ecommerceData.length / this.productPerPage); 
                this.paginateProducts();
                this.checkProductInWishList();
                // console.log(this.ecommerceData);
                
            }catch(error){
                console.log('Fetching data ', error)
            }
        },

        // function copied from details.js - line 79 to 100
        async fetchProductDetails(){
            if(!this.productId) 
                return;

            try{
                const response = await fetch(`https://dummyjson.com/products/${this.productId}`)
                const data = await response.json();
                this.productInfo = data;
                console.log("my product",this.productInfo);
                await this.getSimilarProduct();
                
                this.checkProductInCartForAdded();
                this.checkProductInWishList();
                // this.postReview();

                console.log('fetched product', this.productInfo);
                

            }catch(error){
                console.log("Error fetching product details", error);
            }
        },


        increaseQuantity(){
            this.placeholder++;
            this.cartButtonText = 'Updated Cart';
            this.saveToLocalStorage();
           
          },
          decreaseQuantity(){
            
            if(this.placeholder >=2)
                
              return  this.placeholder--; 
              this.cartButtonText = 'Updated Cart';
              this.saveToLocalStorage(); 
            
          },
        
        loadCartFromLocalStorage(){
            const cartData = JSON.parse(localStorage.getItem('cart'));

            console.log("Loaded cart data:", cartData);

            if(cartData){
                this.cart = cartData;
            }

            const wishListData = JSON.parse(localStorage.getItem('wishList'));
            if(wishListData.length > 0) {
                this.wishList = wishListData;
                console.log("wishlistDAta");
                console.log( this.wishList);
                
            }else{
                console.log("No Data to display!!!!!");
                
            }
          },

          showMyCart(){
            console.log("my cart calling")
            this.myCartVisible = !this.myCartVisible;
        },

        showMyWishList(){
            console.log("show my wishlist calling");
            
            this.myWishListVisible = !this.myWishListVisible;
        },

        addToCart(){
            if(this.productInfo){
                let cart = JSON.parse(localStorage.getItem('cart')) || [];

                const existingProduct = cart.find(item => item.id === this.productInfo.id);

                if(!existingProduct){

                    const cartItem = {
                        id: this.productInfo.id,
                        title: this.productInfo.title,
                        images: this.productInfo.images,
                        discountPrice : this.discountPrice,
                        price: this.productInfo.price,
                        quantity : this.placeholder
                    }

                    cart.push(cartItem);
                    this.cart = cart; 
                    this.saveToLocalStorage();
                    this.checkProductInCartForAdded();
                    
                    // this.cartButtonText = 'Added'; 

                }else{
                    existingProduct.quantity = this.placeholder;  
                    this.cart = cart;
                    this.saveToLocalStorage();
                    this.checkProductInCartForAdded();
                }
            }
        },


        saveToWishList(){
            console.log("wishlist calling");
            
            if(this.productInfo){
                const wishList = JSON.parse(localStorage.getItem('wishList')) || [];
                const existingWishListProduct = wishList.find(item => item.id === this.productInfo.id);
                if(!existingWishListProduct){
                    const wishListItem = {
                        id: this.productInfo.id,
                        title: this.productInfo.title,
                        images: this.productInfo.images,
                        discountPrice : this.discountPrice,
                        price: this.productInfo.price,
                        quantity : this.placeholder
                    }
                    wishList.push(wishListItem);
                    this.wishList = wishList;
                    this.saveToLocalStorage();
                    this.isInWishList = true;
                    this.saveButtonText  = "Saved";
                    this.checkProductInWishList();
                }
            }
        },


        checkProductInCartForAdded() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingProduct = cart.find(item => item.id == this.productInfo.id);
    
            if (existingProduct) {
                console.log("Product is in cart:", existingProduct);
                this.cartButtonText = 'Added';  
            }else{
                console.log("Product is NOT in cart.");
                this.cartButtonText = 'Add to cart';
            }
        },


        checkProductInWishList(){
            const wishList = JSON.parse(localStorage.getItem('wishList')) || [];
            const existingProduct = wishList.find(item => item.id == this.productInfo.id);

            if(existingProduct){
                console.log("product is in wishlist", existingProduct)
                this.saveButtonText = "Saved";
                this.isInWishList = true;
                console.log(this.saveButtonText)
            }else{
                this.saveButtonText = "Save";
                this.isInWishList = false;
            }
        },

        
        saveToLocalStorage(){
            localStorage.setItem('cart', JSON.stringify(this.cart));
            localStorage.setItem('wishList', JSON.stringify(this.wishList));
            
        },



        removeItem(itemId){
            const updatedCart = this.cart.filter(item => item.id !== itemId);
            this.cart = updatedCart;
        
            localStorage.setItem('cart', JSON.stringify(updatedCart));

        // alert("Item removed from cart");
            this.cartButtonText = 'Add to cart'
        
        },

        removeItemFromWishList(itemId){
            const updtedWishList = this.wishList.filter(item => item.id !== itemId);
            this.wishList = updtedWishList;
            this.isInWishList = false;
            localStorage.setItem('wishList', JSON.stringify(updtedWishList));

        },


        cartIncreaseQuantity(itemId){
            const item = this.cart.find(item => item.id === itemId);
            if(item){
                item.quantity++;
                this.saveToLocalStorage();
            }
        },

        cartDecreaseQuantity(itemId){
            const item = this.cart.find(item => item.id === itemId);
            if(item && item.quantity > 1){
                item.quantity--;
                this.saveToLocalStorage();
            }
        },


        wishListIncreaseQuantity(itemId){
            const item = this.wishList.find(item => item.id === itemId);
            if(item){
                item.quantity++;
                this.saveToLocalStorage();
            }
        },

        wishListDecreaseQuantity(itemId){
            const item = this.wishList.find(item => item.id === itemId);
            if(item && item.quantity > 1){
                item.quantity--;
                this.saveToLocalStorage();
            }
        },


        moveToCart(item){
            
            console.log("move to crt");
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            let wishList = JSON.parse(localStorage.getItem('wishList')) || [];

            const existingProductInCart = cart.find(cartItem => cartItem.id === item.id);
            if(existingProductInCart){
                this.showAlertModal = true;
                this.modalMessage = "This product is already in the cart, Do you want to update it"

                this.itemToMove = item;
              
            }else{
                cart.push(item);
                this.isInWishList = false;
                this.cartButtonText = "Added";

                wishList = wishList.filter(wishListItem => wishListItem.id !== item.id);

                localStorage.setItem('cart', JSON.stringify(cart));
                localStorage.setItem('wishList', JSON.stringify(wishList));

                this.cart = cart;
                this.wishList = wishList;

                
            }     
        },

        confirmMoveToCart() {

            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            let wishList = JSON.parse(localStorage.getItem('wishList')) || [];
        
            const item = this.itemToMove;  
            console.log("s", item);
        
            const existingProductInCart = cart.find(cartItem => cartItem.id === item.id);
        
            if (existingProductInCart) {

                existingProductInCart.quantity = item.quantity;
                wishList = wishList.filter(wishListItem => wishListItem.id !== item.id);
        
                localStorage.setItem('cart', JSON.stringify(cart));
                localStorage.setItem('wishList', JSON.stringify(wishList));
        
                this.cart = cart;
                this.wishList = wishList;
        
                this.isInWishList = false;
                this.cartButtonText = "Added";
        
                this.showAlertModal = false;

            } else {
                this.showAlertModal = false;
            }
        },











        paginateProducts() {
            const start = (this.currentPage - 1) * this.productPerPage;
            const end = start + this.productPerPage;
            this.filteredProducts = this.ecommerceData.slice(start, end);
            this.checkProductInWishList();
        },

        gotoPage(page){
            this.currentPage = page;
            this.paginateProducts();
        },
        previousPage(){
            if(this.currentPage > 1){
                this.currentPage--;
                this.paginateProducts();

            }
        },
        nextPage(){
            if(this.currentPage < this.totalPages){
                this.currentPage++;
                this.paginateProducts();
            }
        },


 
       async getProduct(){
        if(!this.enteredProductTitle){
            alert("Enter Valid Product name")
        }
            try{
                const response = await fetch(`https://dummyjson.com/products/search?q=${this.enteredProductTitle}`)

                const data = await response.json();
                this.ecommerceData = data.products;
                this.totalPages = Math.ceil(this.ecommerceData.length / this.productPerPage);
                this.paginateProducts();
                this.checkProductInWishList();


                if(this.enteredProductTitle.length >= 3){

                    const searchedProduct = this.ecommerceData.filter(product=> product.title.toLowerCase().includes(this.enteredProductTitle.toLowerCase()))
                    if(searchedProduct.length > 0){
                        this.ecommerceData = searchedProduct;

                        this.totalPages = Math.ceil(this.ecommerceData.length / this.productPerPage);
                        this.currentPage = 1; // Reset to first page after filtering
                        this.paginateProducts();
                    }
                }

            }catch(error){
                console.log('fetching Data', error)
            }
        },

        async searchInput(){
            // Clear the previous debounce timeout if there's a new input
            
            clearTimeout(this.debounceTimeout);


            // this is cancled the previous request 
            if(this.abortController){
                this.abortController.abort();
            }

            // creating instance of AbortController
            this.abortController = new AbortController;

            this.debounceTimeout = setTimeout(async ()=>{
                
             
                if(this.enteredProductTitle.length >= 3){
                    try{
                        const response = await fetch(`https://dummyjson.com/products/search?q=${this.enteredProductTitle}`, {
                            signal : this.abortController.signal
                        });
                        if(response.ok){
                            const data = await response.json();
                            this.suggestionProduct = data.products;
                            this.filtersApplied = true;
                        }
                        
    
                    }catch (error) {
                        if (error.name !== 'AbortError') {
                        console.log("Error fetching suggestions:", error);
                        }
                    } 
                }else{
    
                    // Clearing suggestions if input length is less than 3 characters
                    this.suggestionProduct = [];
                }
            }, 500)           
          
        },

        selectSuggestion(product) {

            clearTimeout(this.debounceTimeout);

            if(this.abortController){
                this.abortController.abort();
            }

            // const abortController = new AbortController;

               
                this.enteredProductTitle = product.title; 
                this.suggestionProduct = []; 
                this.filtersApplied = true;

                 // Set the `ecommerceData` to only show the selected product
                this.ecommerceData = [product]; 

                this.totalPages = 1;
                this.currentPage = 1;
                this.paginateProducts();
          },

       

        toggleView(view) {
            this.viewMode = view;
        },

        async getCategory(){
            try{
                const response = await fetch(`https://dummyjson.com/products/category-list`)
                const data = await response.json();
                this.productCategory = data;
               
                // console.log(this.productCategory,"prddd")
            }catch(error){
                console.log("fetching category", error)
            }
        },

        async filterByCategory(cat){

            try{

                if (cat === "") {
                    this.ecommerceData = [...this.allProductsData]; 
                }else{
                const response = await fetch(`https://dummyjson.com/products/category/${cat}`)
                const data = await response.json();
                this. ecommerceData = data.products;
                this.filtersApplied = true;
                }

                this.totalPages = Math.ceil(this.ecommerceData.length / this.productPerPage);
                this.currentPage = 1; 
                this.paginateProducts();
               
            }catch(error){
                console.log("fetching category", error)
            }

        },

        sortProduct(){
            if(this.sortOrder === 'ascending'){
                this.ecommerceData.sort((a, b) => a.title.localeCompare(b.title));
            } else if (this.sortOrder === "descending") {
                this.ecommerceData.sort((a, b) => b.title.localeCompare(a.title));
            }

            console.log(this.ecommerceData, "after sorting")
            this.totalPages = Math.ceil(this.ecommerceData.length / this.productPerPage);
            this.currentPage = 1; // Reset to first page
            this.paginateProducts();
            this.filtersApplied = true;
        },

        clearFilters() {
            this.enteredProductTitle = '';
            this.selectedCategory = '';
            this.sortOrder = '';
            this.filtersApplied = false;  
            this.allProducts();
            // this.totalPages = Math.ceil(this.ecommerceData.length / this.productPerPage);
            // this.currentPage = 1;
            // this.paginateProducts();
        },


        goToProductDetails(productId){
            window.location.href = `/product-details.html?id=${productId}`;
        },

        // async productWithId(){
        //     try{
        //         const response = await fetch(`https://dummyjson.com/products/${this.productId}`)
        //         const data = await response.json();
        //         this.wishListProduct = data;
        //     }catch(error){
        //         console.log("Fetching error to getting product Id", error);
                
        //     }
        // },

        saveToWishList(product){

            
            if(product){
                const wishList = JSON.parse(localStorage.getItem('wishList')) || [];

                const existingWishListProduct = wishList.find(item => item.id === product.id);
                
                if(!existingWishListProduct){

                    if (isNaN(product.price) || (product.discountPercentage && isNaN(product.discountPercentage))) {
                        alert("Invalid price or discount percentage");
                        return;
                    }

                    const discountPrice = product.discountPercentage
                    ? (product.price - (product.price * product.discountPercentage / 100)).toFixed(2)
                    : product.price.toFixed(2);

                    const discountPriceNum = parseFloat(discountPrice);

                    console.log("discount price", discountPrice);
                    
                    const wishListItem = {
                        id: product.id,
                        title: product.title,
                        images: product.images,
                        discountPrice : discountPriceNum,
                        price: product.price,
                        quantity : 1
                    }
                    // console.log("wishlist item", wishListItem);
                    
                    wishList.push(wishListItem);
                    this.showAlertModal = true;
                    // this.checkProductInWishList();
                    // this.wishListButtonText = "Added to wishlist"
                    this.wishList = wishList;
                   
                    localStorage.setItem('wishList', JSON.stringify(wishList));
                    // console.log("wish list product in local storage", JSON.parse(localStorage.getItem('wishList')));
                    // this.checkProductInWishList();
                    
                    // this.wishListButtonText = "Added to Wishlist"


                    
                    // alert("Product Added in the WishList")
                }else{
                    this.alreadyProductAlertModal = true;
                    // this.wishListButtonText = "Add to wishlist"
                    // this.showAlertModal = true;
                    // alert("Product is already in the WishList");
                }
            }
        },



        // checkProductInWishList(){
        //     console.log("check calling");
            
            
        //         const wishList = JSON.parse(localStorage.getItem('wishList')) || [];
        //         console.log("checking product", product);
                
        //         const existingProduct = wishList.find(item => item.id === this.product.id);
        //         console.log("exist prod", existingProduct );
                
    
        //         if(existingProduct){
        //             console.log("product is in wishlist", existingProduct)
        //             this.wishListButtonText = "Added to wishlist";
        //         }else{
        //             this.wishListButtonText = "Add to wishlist";
        //         }

        // },

    },

    

}).mount('#ecommerce') 