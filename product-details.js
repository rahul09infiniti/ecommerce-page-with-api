const app = Vue.createApp({
    data(){
        return{
            isLoggedIn : false,
            enteredEmail : '',
            enteredUsername : '',
            enteredPassword : '',
            enteredConfirmPassword : '',
            currentusername : this.getUsernameFromStorage(),

            showSignLoginModal : false,
            showCreateAccountModal : false,

            productInfo : null,
            productId : null,
            enteredProductTitle : '',
            // errorMessage : '',
            InputSuggestionProduct : [],
            placeholder : 1,
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
            // clickSimilarToGetProduct : false,
        }
    },

    mounted(){
       
        this. checkLoginState();
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id');
        
        console.log('Product ID from URL:', this.productId);
        this.loadCartFromLocalStorage();
        this.loadReviewFirst();

        

        this.fetchProductDetails();
        
       
    },

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
        createNewUserAccount(){
            if(this.enteredEmail && this.enteredUsername && this.enteredPassword && this.enteredConfirmPassword){
                if(this.enteredPassword === this.enteredConfirmPassword){

                    const newUser = {
                        email : this.enteredEmail,
                        username : this.enteredUsername,
                        password : this.enteredPassword,
                        // confirmPassword : this.enteredConfirmPassword
                    };
                    const createdUser = JSON.parse(localStorage.getItem('newUser')) || [];

                    const userExist = createdUser.find(user => user.email === this.enteredEmail);
                    if(userExist){
                        alert("This email is already registered");
                        return;
                    }

                    createdUser.push(newUser);
                    localStorage.setItem('newUser', JSON.stringify(createdUser));
                    this.isLoggedIn = true;
                    this.currentUsername = this.enteredUsername; 

                    
                    localStorage.setItem('currentUsername', this.enteredUsername);

                    alert("account created successfully");


                    this.showCreateAccountModal = false;
                    this.showSignLoginModal = false;
                }else{
                    alert("password not matched")
                }
            }else{
                alert("fill all the field")
            }
            
        },
        getUsernameFromStorage(){
            const storedUsername = localStorage.getItem('currentUsername');
            return storedUsername ? storedUsername : 'guest';
        },

        loginUser(){
            
            const enteredEmail = this.enteredEmail;
            const enteredPassword = this.enteredPassword;

            const createdUser = JSON.parse(localStorage.getItem('newUser')) || [];

            const user = createdUser.find(user => user.email === enteredEmail);
            if(user){
                if(user.password === enteredPassword){
                   

                    localStorage.setItem('currentUsername', user.username);
                    this.currentUsername = user.username;
                    this.isLoggedIn = true;
                    this.showSignLoginModal = false;
                    alert("login successfully");
                }else{
                    alert("incorrect password!")
                }
            }else{
                alert("user not found")
            }
        },
        signOut(){
            this.currentUsername = 'guest';
            this.isLoggedIn = false;
            localStorage.removeItem('currentUsername'); 
            alert("user logged out successfully")
        },

        checkLoginState(){
            const storedUsername = localStorage.getItem('currentUsername');
            if (storedUsername) {
                this.isLoggedIn = true;
                this.currentUsername = storedUsername;
            } else {
                this.isLoggedIn = false;
                this.currentUsername = 'guest';
            }
        },

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

        async getProduct(){
            
            if(this.enteredProductTitle.trim() === ''){
                alert("Please enter product title")
                return;
                
            }
            

            try{
                
                const response = await fetch(`https://dummyjson.com/products/search?q=${this.enteredProductTitle}`)
                const data = await response.json();

                console.log("getproduct", data)
                if(data && data.products && data.products.length > 0){
                    this.productInfo = data.products[0]

                

                    // this.placeholder = 1;
                    this.checkProductInCartForAdded();
                    this.checkProductInWishList();
                  
                    
                }else{
                    // this.productInfo = null;
                    // this.errorMessage = "No product found"; 
                    alert("Product not found");
                }
            }catch(error){
                console.log("Error fetching product", error);
            }
        },


        async searchInputProduct(){
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
                            this.InputSuggestionProduct = data.products;
                            this.filtersApplied = true;

                        }
                        
    
                    }catch (error) {
                        if (error.name !== 'AbortError') {
                        console.log("Error fetching suggestions:", error);
                        }
                    } 
                }else{
    
                    // Clearing suggestions if input length is less than 3 characters
                    this.InputSuggestionProduct = [];
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
                this.InputSuggestionProduct = []; 

                 // Set the `ecommerceData` to only show the selected product
                this.ecommerceData = [product]; 


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
            if(wishListData && Array.isArray(wishListData) &&  wishListData.length > 0) {
                this.wishList = wishListData;
                console.log("wishlistDAta");
                console.log( this.wishList);
                
            }else{
                console.log("No Data to display!!!!!");
                
            }
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

        showMyCart(){
            console.log("my cart calling")
            this.myCartVisible = !this.myCartVisible;
        },

        showMyWishList(){
            this.myWishListVisible = !this.myWishListVisible;
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
        setActiveTab(currentActiveTab){
            this.activeTab = currentActiveTab;
        },

        async getSimilarProduct(){
            console.log("info cat",this.productInfo.category);
            
            try{
                const response = await fetch(`https://dummyjson.com/products/category/${this.productInfo.category}`);
                const data = await response.json();
                console.log("data", data);
                
                // this.similarProducts = data;
                this.similarProducts = data.products.filter(product => product.id !== this.productInfo.id);

                console.log("Similar products:", this.similarProducts);
                console.log("Raw similar products:", data.products);
            }catch(error){
                console.log("Fetching similar product", error);
                
            }
        },

        selectSimilarProduct(product){
            this.selectProduct(product);
        },

        selectProduct(product){
            this.productInfo = product;
            this.productId = product.id;
            console.log("Selected product ID: ", this.productId);

            // fetching the new product  details and reviews
            this.fetchProductDetails();
            this.loadReviewFirst(); 
        },

        writeReview(){
            console.log("clling write review");
            
            this.showReviewModal = true;
        },
        setRating(star){
            this.currentRating = star;
        },

        loadReviewFirst(){
            const savedUserReviews = JSON.parse(localStorage.getItem('reviews_' + this.productId));
            console.log("saved user",savedUserReviews);
            
            if(savedUserReviews){
                this.userReviewList = savedUserReviews;
            }else{
                userReviewList = [];
            }
        },

        postReview(){
            if(this.username && this.comment && this.currentRating > 0){
                const userReview = {
                    username : this.username,
                    comment : this.comment,
                    rating : this.currentRating,
                    date: new Date() 
                };

                let productReview = JSON.parse(localStorage.getItem('reviews_' + this.productId)) || [];
                productReview.push(userReview);
            
                // Save the new review to localStorage
                localStorage.setItem('reviews_' + this.productId, JSON.stringify(productReview));
            
                // Update the reviews list
                this.userReviewList = productReview;
            
                // Clear the form fields
                // this.username = '';
                // this.comment = '';
                // this.currentRating = 0;
            
                // Close the modal
                this.showReviewModal = false;
                // alert("Review posted successfully")
            }else{
                // alert("fill the input filled")
            }
        },
        
        

    }
}).mount('#productDetails'); 