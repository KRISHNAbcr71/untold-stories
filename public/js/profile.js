
const editProfileImage = document.getElementById('editProfileImage')
const profileImageInput = document.getElementById('profileImageInput')

// Check whether the profile image elements exist
if (editProfileImage && profileImageInput) {

    editProfileImage.addEventListener('click', function () {
        profileImageInput.click()
    })

    profileImageInput.addEventListener('change', async function () {

        const file = profileImageInput.files[0]

        if (!file) {
            return
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

        if (!allowedTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File',
                text: 'Please select a JPG, PNG or WebP image.'
            })

            profileImageInput.value = ''
            return
        }

        // Validate file size (5 MB)
        const maxSize = 5 * 1024 * 1024

        if (file.size > maxSize) {
            Swal.fire({
                icon: 'error',
                title: 'File Too Large',
                text: 'Please select an image smaller than 5 MB.'
            })

            profileImageInput.value = ''
            return
        }

        const formData = new FormData()
        formData.append('profileImage', file)

        try {
            const response = await fetch('/profile/editImage', {
                method: 'PATCH',
                body: formData
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message)
            }

            const imageUrl = URL.createObjectURL(file)

            const profileImageContainer = document.querySelector('.w-14.h-14.rounded-full')

            profileImageContainer.innerHTML = `
                <img
                    src="${imageUrl}"
                    alt="Profile picture"
                    class="w-full h-full object-cover rounded-full">
            `

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: result.message
            })

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.message || 'Unable to upload profile image.'
            })

        } finally {
            profileImageInput.value = ''
        }
    })
}
