 // product add to cart
  document.addEventListener('click',async(event)=>{
    const button = event.target.closest('.add-to-cart-btn')
    if(!button){
      return
    }

    const productId = button.dataset.productId

    try {
      button.disabled = true

      const response = await fetch(`/cart/add/${productId}`,{
        method:'POST',
        headers:{
          'Accept':'application/json'
        }
      })

      const result = await response.json()

      if(!response.ok || !result.success){
        Swal.fire({
          icon: 'error',
          title: 'Unable to Add',
          text: result.message
        })
        return
      }

      Swal.fire({
        icon: 'success',
        title: 'Added to Cart!',
        text: result.message,
        timer: 1500,
        showConfirmButton: false
      })

    } catch (error) {
      console.error('Add to cart error:', error);

      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
        text: 'Please try again.'
      });
    }finally{
      button.disabled = false
    }
  })



  // product add to wishlist
  document.addEventListener('click',async(event)=>{
    const button = event.target.closest('.add-to-wishlist-btn')
    if(!button){
      return
    }

    const productId = button.dataset.productId

    try {
      button.disabled = true

      const response = await fetch(`/wishlist/add/${productId}`,{
        method:'POST',
        headers:{
          'Accept':'application/json'
        }
      })

      const result = await response.json()

      if(!response.ok || !result.success){
        Swal.fire({
          icon: 'error',
          title: 'Unable to Add',
          text: result.message
        })
        return
      }

      Swal.fire({
        icon: 'success',
        title: 'Added to Wishlist!',
        text: result.message,
        timer: 1500,
        showConfirmButton: false
      })

    } catch (error) {
      console.error('Add to wishlist error:', error);

      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
        text: 'Please try again.'
      });
    }finally{
      button.disabled = false
    }
  })