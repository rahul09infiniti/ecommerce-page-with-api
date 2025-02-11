const app = Vue.createApp({
    data(){
        return{
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
        }
    },
     mounted(){
        this.allProducts();
        this.getCategory();
        // const wishListData = JSON.parse(localStorage.getItem('wishList'));
        // if(wishListData){
        //     this.wishListData = this.wishList;
        // }
    },
    methods:{
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
            // console.log("wishlist calling");
            // console.log("product", product);
            // console.log("product price", product.price);

            
            if(product){
                const wishList = JSON.parse(localStorage.getItem('wishList')) || [];

                const existingWishListProduct = wishList.find(item => item.id === product.id);
                
                if(!existingWishListProduct){

                    if (isNaN(product.price) || (product.discountPercentage && isNaN(product.discountPercentage))) {
                        alert("Invalid price or discount percentage");
                        return;
                    }


                    // const discountPrice = (product.price - (product.price * product.discountPercentage / 100)).toFixed(2);
                    // const discountPrice = product.discountPercentage
                    // ? (product.price - (product.price * product.discountPercentage / 100)).toFixed(2)
                    // : product.price;



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
                    wishList.push(wishListItem);
                    this.wishList = wishList;
                    // this.checkProductInWishList();
                   
                    localStorage.setItem('wishList', JSON.stringify(wishList));
                    console.log("wish list product in local storage", JSON.parse(localStorage.getItem('wishList')));
                    
                    alert("Product Added in the WishList")
                }else{
                    alert("Product is already in the WishList");
                }
            }
        },

        // checkProductInWishList(){
            
        //         const wishList = JSON.parse(localStorage.getItem('wishList')) || [];
        //         const existingProduct = wishList.find(item => item.id == this.product.id);
    
        //         if(existingProduct){
        //             console.log("product is in wishlist", existingProduct)
        //             this.wishListButtonText = "Added to wishlist";
        //             // this.isInWishList = true;
        //             // console.log(this.saveButtonText)
        //         }else{
        //             this.wishListButtonText = "Add to wishlist";
        //             // this.isInWishList = false;
        //         }
            
           
        // },

    

    }


}).mount('#ecommerce') 