const { createApp, ref, onMounted, watch } = Vue;

createApp({
  setup() {
    const form = ref({
      fullName: '',
      dob: '',
      gender: '',
      totalVisitors: null,
      childrenCount: null,
      accommodation: '',
      cardName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    });
    
    const errors = ref({
      fullName: '',
      dob: '',
      gender: '',
      selectedPlaces: '',
      totalVisitors: '',
      childrenCount: '',
      accommodation: '',
      cardName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    });
    
    const generalError = ref('');
    const places = ref([]);
    const isLoadingPlaces = ref(false);
    const placesError = ref('');
    const selectedPlaces = ref([]);
    const accommodationOptions = ref([
      { value: '', label: '-- Choose accommodation --', disabled: true },
      { value: 'none', label: 'No accommodation needed', disabled: false },
      { value: 'forest_view', label: 'Forest View Hotel', disabled: false },
      { value: 'totoro_inn', label: 'Totoro Family Inn', disabled: false },
      { value: 'witch_valley', label: 'Witch Valley Guesthouse', disabled: false },
      { value: 'luxury_ghibli', label: 'Luxury Ghibli Resort', disabled: false }
    ]);
    const showSummary = ref(false);
    
    const truncate = (text, length) => {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    };
    
    const isSelected = (id) => {
      return selectedPlaces.value.some(p => p.id === id);
    };
    
    const togglePlace = (place) => {
      const exists = selectedPlaces.value.find(p => p.id === place.id);
      if (exists) {
        selectedPlaces.value = selectedPlaces.value.filter(p => p.id !== place.id);
      } else {
        selectedPlaces.value.push(place);
      }
      if (errors.value.selectedPlaces) errors.value.selectedPlaces = '';
    };
    
    const loadPlaces = async () => {
      isLoadingPlaces.value = true;
      placesError.value = '';
      try {
        const response = await fetch('ghibli_park.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}: Could not load park data.`);
        const data = await response.json();
        places.value = data.map(p => ({
          ...p,
          image: p.image && p.image.startsWith('assets/') ? p.image : `assets/${p.image || 'default.jpg'}`
        }));
      } catch (err) {
        console.error(err);
        placesError.value = 'Failed to load Ghibli Park places. Please check json file.';
      } finally {
        isLoadingPlaces.value = false;
      }
    };
    
    const clearErrors = () => {
      Object.keys(errors.value).forEach(key => {
        errors.value[key] = '';
      });
      generalError.value = '';
    };
    
    const getAccommodationLabel = (val) => {
      const found = accommodationOptions.value.find(opt => opt.value === val);
      return found ? found.label : 'Not selected';
    };
    
    const maskCard = (num) => {
      if (!num) return '****';
      const cleaned = num.replace(/\s/g, '');
      if (cleaned.length <= 4) return '****';
      return '**** **** **** ' + cleaned.slice(-4);
    };
    
    const validateForm = () => {
      let isValid = true;
      
      if (!form.value.fullName.trim()) {
        errors.value.fullName = 'Full name is required.';
        isValid = false;
      } else errors.value.fullName = '';
      
      if (!form.value.dob) {
        errors.value.dob = 'Date of birth is required.';
        isValid = false;
      } else errors.value.dob = '';
      
      if (!form.value.gender) {
        errors.value.gender = 'Please select your gender.';
        isValid = false;
      } else errors.value.gender = '';
      
      if (selectedPlaces.value.length === 0) {
        errors.value.selectedPlaces = 'Please select at least one Ghibli Park attraction.';
        isValid = false;
      } else errors.value.selectedPlaces = '';
      
      if (form.value.totalVisitors === null || form.value.totalVisitors === '' || form.value.totalVisitors < 1) {
        errors.value.totalVisitors = 'Total visitors must be at least 1.';
        isValid = false;
      } else errors.value.totalVisitors = '';
      
      if (form.value.childrenCount === null || form.value.childrenCount === '') {
        errors.value.childrenCount = 'Number of children is required (0 if none).';
        isValid = false;
      } else if (form.value.childrenCount < 0) {
        errors.value.childrenCount = 'Children count cannot be negative.';
        isValid = false;
      } else if (form.value.childrenCount > form.value.totalVisitors) {
        errors.value.childrenCount = 'Children cannot exceed total visitors.';
        isValid = false;
      } else errors.value.childrenCount = '';
      
      if (!form.value.accommodation || form.value.accommodation === '') {
        errors.value.accommodation = 'Please select an accommodation option.';
        isValid = false;
      } else errors.value.accommodation = '';
      
      if (!form.value.cardName.trim()) {
        errors.value.cardName = 'Name on card is required.';
        isValid = false;
      } else errors.value.cardName = '';
      
      if (!form.value.cardNumber.trim()) {
        errors.value.cardNumber = 'Card number is required.';
        isValid = false;
      } else {
        const cardClean = form.value.cardNumber.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cardClean)) {
          errors.value.cardNumber = 'Enter a valid card number (13-19 digits).';
          isValid = false;
        } else errors.value.cardNumber = '';
      }
      
      if (!form.value.expiryDate) {
        errors.value.expiryDate = 'Expiration date is required.';
        isValid = false;
      } else {
        const [year, month] = form.value.expiryDate.split('-');
        const today = new Date();
        const expDate = new Date(parseInt(year), parseInt(month) - 1);
        if (expDate < today) {
          errors.value.expiryDate = 'Card is expired. Choose a future date.';
          isValid = false;
        } else errors.value.expiryDate = '';
      }
      
      if (!form.value.cvv.trim()) {
        errors.value.cvv = 'CVV/CVC is required.';
        isValid = false;
      } else if (!/^\d{3,4}$/.test(form.value.cvv.trim())) {
        errors.value.cvv = 'CVV must be 3 or 4 digits.';
        isValid = false;
      } else errors.value.cvv = '';
      
      return isValid;
    };
    
    const generateItinerary = () => {
      clearErrors();
      const valid = validateForm();
      if (valid) {
        generalError.value = '';
        showSummary.value = true;
        setTimeout(() => {
          document.querySelector('.summary-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        showSummary.value = false;
        generalError.value = 'There are mandatory items pending to be filled. Please complete the required fields.';
        document.querySelector('.general-error')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    
    onMounted(() => {
      loadPlaces();
    });
    
    watch([form, selectedPlaces], () => {
      if (showSummary.value) showSummary.value = false;
      if (generalError.value) generalError.value = '';
    }, { deep: true });
    
    return {
      form,
      errors,
      generalError,
      places,
      isLoadingPlaces,
      placesError,
      selectedPlaces,
      accommodationOptions,
      showSummary,
      truncate,
      isSelected,
      togglePlace,
      generateItinerary,
      getAccommodationLabel,
      maskCard,
      clearErrors
    };
  }
}).mount('#app');