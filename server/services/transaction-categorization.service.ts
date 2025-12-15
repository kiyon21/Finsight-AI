/**
 * Transaction Categorization Service
 * 
 * Provides intelligent categorization of transactions based on merchant names,
 * descriptions, and transaction patterns. Supports both simple category arrays
 * and detailed personal finance categories.
 */

export interface PersonalFinanceCategory {
  primary: string;
  detailed: string;
}

export class TransactionCategorizationService {
  /**
   * Categorize transaction into an array of category strings
   * Returns hierarchical categories (e.g., ['Food and Drink', 'Coffee'])
   */
  categorizeTransaction(description: string): string[] {
    const desc = description.toUpperCase();

    // Food and Drink Categories
    if (this.matchesPattern(desc, ['STARBUCKS', 'TIM HORTONS', 'TIMHORTONS', 'COFFEE', 'CAFE', 'ESPRESSO', 'LATTE'])) {
      return ['Food and Drink', 'Coffee'];
    }
    if (this.matchesPattern(desc, ['PIZZA', 'DOMINO', 'PIZZA HUT', 'PIZZAHUT', 'LITTLE CAESARS', 'PAPA JOHNS'])) {
      return ['Food and Drink', 'Restaurants', 'Pizza'];
    }
    if (this.matchesPattern(desc, ['MCDONALD', 'BURGER KING', 'WENDY', 'A&W', 'HARVEY', 'IN-N-OUT', 'FIVE GUYS'])) {
      return ['Food and Drink', 'Restaurants', 'Fast Food'];
    }
    if (this.matchesPattern(desc, ['RESTAURANT', 'DINER', 'BISTRO', 'GRILL', 'CHICK-FIL-A', 'SUBWAY', 'TACO BELL', 'KFC'])) {
      return ['Food and Drink', 'Restaurants'];
    }
    if (this.matchesPattern(desc, ['UBER EATS', 'DOORDASH', 'SKIP', 'GRUBHUB', 'FOOD DELIVERY'])) {
      return ['Food and Drink', 'Restaurants', 'Food Delivery'];
    }
    if (this.matchesPattern(desc, ['FOOD BASICS', 'ZEHRS', 'LOBLAWS', 'METRO', 'NO FRILLS', 'GROCERY', 'SUPERSTORE', 'SAFEWAY', 'WHOLE FOODS', 'TRADER JOE'])) {
      return ['Food and Drink', 'Groceries'];
    }
    if (this.matchesPattern(desc, ['LCBO', 'BEER STORE', 'WINE', 'LIQUOR', 'ALCOHOL'])) {
      return ['Food and Drink', 'Alcohol'];
    }

    // Transportation Categories
    if (this.matchesPattern(desc, ['UBER', 'LYFT', 'TAXI', 'CAB', 'RIDE SHARE'])) {
      return ['Transportation', 'Ride Share'];
    }
    if (this.matchesPattern(desc, ['SHELL', 'PETRO', 'ESSO', 'MOBIL', 'GAS', 'PETRO-CANADA', 'SUNOCO', 'CHEVRON', 'BP', 'EXXON'])) {
      return ['Transportation', 'Gas'];
    }
    if (this.matchesPattern(desc, ['PARKING', 'PARKING METER', 'IMPARK', 'INDIGO PARKING'])) {
      return ['Transportation', 'Parking'];
    }
    if (this.matchesPattern(desc, ['TTC', 'GO TRANSIT', 'TRANSIT', 'METRO', 'SUBWAY', 'BUS', 'TRAIN', 'VIA RAIL'])) {
      return ['Transportation', 'Public Transit'];
    }
    if (this.matchesPattern(desc, ['AIRPORT', 'AIR CANADA', 'WESTJET', 'AIRLINE', 'FLIGHT'])) {
      return ['Transportation', 'Air Travel'];
    }

    // Shopping Categories
    if (this.matchesPattern(desc, ['WALMART', 'TARGET', 'COSTCO', 'DOLLARAMA', 'DOLLAR TREE'])) {
      return ['Shopping', 'General Merchandise'];
    }
    if (this.matchesPattern(desc, ['AMAZON', 'AMZN'])) {
      return ['Shopping', 'Online Shopping'];
    }
    if (this.matchesPattern(desc, ['BEST BUY', 'FUTURE SHOP', 'ELECTRONICS'])) {
      return ['Shopping', 'Electronics'];
    }
    if (this.matchesPattern(desc, ['HOME DEPOT', 'LOWES', 'RONA', 'CANADIAN TIRE', 'HARDWARE'])) {
      return ['Shopping', 'Home Improvement'];
    }
    if (this.matchesPattern(desc, ['CLOTHING', 'H&M', 'ZARA', 'OLD NAVY', 'GAP', 'NORDSTROM', 'MACY'])) {
      return ['Shopping', 'Clothing'];
    }
    if (this.matchesPattern(desc, ['PHARMACY', 'SHOPPERS', 'REXALL', 'WALGREENS', 'CVS'])) {
      return ['Shopping', 'Pharmacy'];
    }

    // Recreation & Entertainment
    if (this.matchesPattern(desc, ['GOODLIFE', 'GYM', 'FITNESS', 'YMCA', 'FITNESS WORLD', 'ORANGETHEORY'])) {
      return ['Recreation', 'Fitness'];
    }
    if (this.matchesPattern(desc, ['NETFLIX', 'SPOTIFY', 'DISNEY', 'APPLE MUSIC', 'PRIME VIDEO', 'HULU'])) {
      return ['Recreation', 'Entertainment', 'Streaming'];
    }
    if (this.matchesPattern(desc, ['MOVIE', 'CINEMA', 'CINEPLEX', 'AMC', 'THEATRE'])) {
      return ['Recreation', 'Entertainment', 'Movies'];
    }
    if (this.matchesPattern(desc, ['CONCERT', 'TICKETMASTER', 'EVENT', 'SHOW'])) {
      return ['Recreation', 'Entertainment', 'Events'];
    }
    if (this.matchesPattern(desc, ['GOLF', 'TENNIS', 'SPORTS', 'RECREATION'])) {
      return ['Recreation', 'Sports'];
    }

    // Bills & Utilities
    if (this.matchesPattern(desc, ['HYDRO', 'ELECTRIC', 'POWER', 'ENERGY'])) {
      return ['Bills', 'Utilities', 'Electric'];
    }
    if (this.matchesPattern(desc, ['GAS BILL', 'NATURAL GAS', 'ENBRIDGE'])) {
      return ['Bills', 'Utilities', 'Gas'];
    }
    if (this.matchesPattern(desc, ['WATER', 'WATER BILL'])) {
      return ['Bills', 'Utilities', 'Water'];
    }
    if (this.matchesPattern(desc, ['ROGERS', 'BELL', 'TELUS', 'FIDO', 'VIRGIN', 'CELL', 'PHONE', 'MOBILE'])) {
      return ['Bills', 'Utilities', 'Phone'];
    }
    if (this.matchesPattern(desc, ['INTERNET', 'CABLE', 'TV', 'SHAW', 'COGECO'])) {
      return ['Bills', 'Utilities', 'Internet/Cable'];
    }
    if (this.matchesPattern(desc, ['INSURANCE', 'AUTO INSURANCE', 'HOME INSURANCE'])) {
      return ['Bills', 'Insurance'];
    }
    if (this.matchesPattern(desc, ['RENT', 'LEASE', 'LANDLORD'])) {
      return ['Bills', 'Housing', 'Rent'];
    }
    if (this.matchesPattern(desc, ['MORTGAGE', 'HOME LOAN'])) {
      return ['Bills', 'Housing', 'Mortgage'];
    }
    if (this.matchesPattern(desc, ['PROPERTY TAX', 'TAXES'])) {
      return ['Bills', 'Taxes'];
    }

    // Financial Services
    if (this.matchesPattern(desc, ['VISA', 'MASTERCARD', 'AMEX', 'CREDIT CARD', 'PAYMENT'])) {
      return ['Payment', 'Credit Card'];
    }
    if (this.matchesPattern(desc, ['E-TRANSFER', 'E-TFR', 'INTERAC', 'E-TRANS'])) {
      return ['Transfer'];
    }
    if (this.matchesPattern(desc, ['ATM', 'BANK MACHINE', 'WITHDRAWAL'])) {
      return ['Bank Fees', 'ATM'];
    }
    if (this.matchesPattern(desc, ['BANK FEE', 'SERVICE CHARGE', 'MONTHLY FEE'])) {
      return ['Bank Fees'];
    }
    if (this.matchesPattern(desc, ['INTEREST', 'INTEREST PAYMENT'])) {
      return ['Financial', 'Interest'];
    }

    // Healthcare
    if (this.matchesPattern(desc, ['PHARMACY', 'DRUG', 'PRESCRIPTION', 'MEDICATION'])) {
      return ['Healthcare', 'Pharmacy'];
    }
    if (this.matchesPattern(desc, ['DENTIST', 'DENTAL', 'ORTHODONTIST'])) {
      return ['Healthcare', 'Dental'];
    }
    if (this.matchesPattern(desc, ['DOCTOR', 'CLINIC', 'HOSPITAL', 'MEDICAL', 'PHYSICIAN'])) {
      return ['Healthcare', 'Medical'];
    }
    if (this.matchesPattern(desc, ['VET', 'VETERINARY', 'PET CARE'])) {
      return ['Healthcare', 'Veterinary'];
    }

    // Education
    if (this.matchesPattern(desc, ['TUITION', 'UNIVERSITY', 'COLLEGE', 'SCHOOL', 'EDUCATION'])) {
      return ['Education', 'Tuition'];
    }
    if (this.matchesPattern(desc, ['BOOKSTORE', 'TEXTBOOK', 'COURSE'])) {
      return ['Education', 'Supplies'];
    }

    // Income
    if (this.matchesPattern(desc, ['PAYROLL', 'SALARY', 'PAYCHECK', 'PAY', 'EMPLOYMENT'])) {
      return ['Income', 'Salary'];
    }
    if (this.matchesPattern(desc, ['GST', 'HST', 'TAX REFUND', 'TAX RETURN'])) {
      return ['Income', 'Tax Refund'];
    }
    if (this.matchesPattern(desc, ['DEPOSIT', 'DEPOSIT FROM'])) {
      return ['Income', 'Deposit'];
    }
    if (this.matchesPattern(desc, ['DIVIDEND', 'INTEREST INCOME'])) {
      return ['Income', 'Investment'];
    }

    // Subscriptions & Services
    if (this.matchesPattern(desc, ['SUBSCRIPTION', 'MONTHLY', 'ANNUAL'])) {
      return ['Services', 'Subscription'];
    }
    if (this.matchesPattern(desc, ['SOFTWARE', 'SaaS', 'CLOUD'])) {
      return ['Services', 'Software'];
    }

    // Default
    return ['Other'];
  }

  /**
   * Detect detailed personal finance category
   * Returns primary and detailed category codes following Plaid's format
   */
  detectCategory(description: string): PersonalFinanceCategory {
    const desc = description.toUpperCase();

    // Food and Drink
    if (this.matchesPattern(desc, ['STARBUCKS', 'TIM HORTONS', 'TIMHORTONS', 'COFFEE', 'CAFE', 'ESPRESSO'])) {
      return { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE_SHOPS' };
    }
    if (this.matchesPattern(desc, ['PIZZA', 'DOMINO', 'PIZZA HUT', 'PIZZAHUT', 'LITTLE CAESARS'])) {
      return { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS' };
    }
    if (this.matchesPattern(desc, ['MCDONALD', 'BURGER KING', 'WENDY', 'A&W', 'FAST FOOD'])) {
      return { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_FAST_FOOD' };
    }
    if (this.matchesPattern(desc, ['RESTAURANT', 'DINER', 'BISTRO', 'GRILL', 'CHICK-FIL-A', 'SUBWAY', 'TACO BELL'])) {
      return { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS' };
    }
    if (this.matchesPattern(desc, ['UBER EATS', 'DOORDASH', 'SKIP', 'GRUBHUB', 'FOOD DELIVERY'])) {
      return { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS' };
    }
    if (this.matchesPattern(desc, ['FOOD BASICS', 'ZEHRS', 'LOBLAWS', 'METRO', 'NO FRILLS', 'GROCERY', 'SUPERSTORE', 'SAFEWAY', 'WHOLE FOODS'])) {
      return { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' };
    }
    if (this.matchesPattern(desc, ['LCBO', 'BEER STORE', 'WINE', 'LIQUOR', 'ALCOHOL'])) {
      return { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_ALCOHOL_AND_BARS' };
    }

    // Transportation
    if (this.matchesPattern(desc, ['UBER', 'LYFT', 'TAXI', 'CAB', 'RIDE SHARE'])) {
      return { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES' };
    }
    if (this.matchesPattern(desc, ['SHELL', 'PETRO', 'ESSO', 'MOBIL', 'GAS', 'PETRO-CANADA', 'SUNOCO', 'CHEVRON', 'BP', 'EXXON'])) {
      return { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_GAS_STATIONS' };
    }
    if (this.matchesPattern(desc, ['PARKING', 'PARKING METER', 'IMPARK', 'INDIGO PARKING'])) {
      return { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_PARKING' };
    }
    if (this.matchesPattern(desc, ['TTC', 'GO TRANSIT', 'TRANSIT', 'METRO', 'SUBWAY', 'BUS', 'TRAIN', 'VIA RAIL'])) {
      return { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_PUBLIC_TRANSPORTATION' };
    }
    if (this.matchesPattern(desc, ['AIRPORT', 'AIR CANADA', 'WESTJET', 'AIRLINE', 'FLIGHT'])) {
      return { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_AIRLINES_AND_AVIATION_SERVICES' };
    }

    // General Merchandise
    if (this.matchesPattern(desc, ['WALMART', 'TARGET', 'COSTCO', 'DOLLARAMA', 'DOLLAR TREE'])) {
      return { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_SUPERSTORES' };
    }
    if (this.matchesPattern(desc, ['AMAZON', 'AMZN'])) {
      return { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' };
    }
    if (this.matchesPattern(desc, ['BEST BUY', 'FUTURE SHOP', 'ELECTRONICS'])) {
      return { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ELECTRONICS' };
    }
    if (this.matchesPattern(desc, ['HOME DEPOT', 'LOWES', 'RONA', 'CANADIAN TIRE', 'HARDWARE'])) {
      return { primary: 'HOME_IMPROVEMENT', detailed: 'HOME_IMPROVEMENT_HARDWARE_STORES' };
    }
    if (this.matchesPattern(desc, ['CLOTHING', 'H&M', 'ZARA', 'OLD NAVY', 'GAP', 'NORDSTROM', 'MACY'])) {
      return { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES' };
    }
    if (this.matchesPattern(desc, ['PHARMACY', 'SHOPPERS', 'REXALL', 'WALGREENS', 'CVS'])) {
      return { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_PHARMACIES' };
    }

    // Recreation
    if (this.matchesPattern(desc, ['GOODLIFE', 'GYM', 'FITNESS', 'YMCA', 'FITNESS WORLD', 'ORANGETHEORY'])) {
      return { primary: 'RECREATION', detailed: 'RECREATION_GYMS_AND_FITNESS_CENTERS' };
    }
    if (this.matchesPattern(desc, ['NETFLIX', 'SPOTIFY', 'DISNEY', 'APPLE MUSIC', 'PRIME VIDEO', 'HULU', 'STREAMING'])) {
      return { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MUSIC_AND_AUDIO' };
    }
    if (this.matchesPattern(desc, ['MOVIE', 'CINEMA', 'CINEPLEX', 'AMC', 'THEATRE'])) {
      return { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MOVIES_AND_FILMS' };
    }
    if (this.matchesPattern(desc, ['CONCERT', 'TICKETMASTER', 'EVENT', 'SHOW', 'TICKETS'])) {
      return { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MUSIC_AND_AUDIO' };
    }
    if (this.matchesPattern(desc, ['GOLF', 'TENNIS', 'SPORTS', 'RECREATION'])) {
      return { primary: 'RECREATION', detailed: 'RECREATION_SPORTS' };
    }

    // Bills & Utilities
    if (this.matchesPattern(desc, ['HYDRO', 'ELECTRIC', 'POWER', 'ENERGY'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_UTILITIES_ELECTRIC' };
    }
    if (this.matchesPattern(desc, ['GAS BILL', 'NATURAL GAS', 'ENBRIDGE'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_UTILITIES_GAS' };
    }
    if (this.matchesPattern(desc, ['WATER', 'WATER BILL'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_UTILITIES_WATER' };
    }
    if (this.matchesPattern(desc, ['ROGERS', 'BELL', 'TELUS', 'FIDO', 'VIRGIN', 'CELL', 'PHONE', 'MOBILE'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_TELECOMMUNICATION' };
    }
    if (this.matchesPattern(desc, ['INTERNET', 'CABLE', 'TV', 'SHAW', 'COGECO'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_TELECOMMUNICATION' };
    }
    if (this.matchesPattern(desc, ['INSURANCE', 'AUTO INSURANCE', 'HOME INSURANCE'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_INSURANCE' };
    }
    if (this.matchesPattern(desc, ['RENT', 'LEASE', 'LANDLORD'])) {
      return { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_RENT' };
    }
    if (this.matchesPattern(desc, ['MORTGAGE', 'HOME LOAN'])) {
      return { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_MORTGAGE_PAYMENT' };
    }
    if (this.matchesPattern(desc, ['PROPERTY TAX', 'TAXES'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING' };
    }

    // Financial Services
    if (this.matchesPattern(desc, ['VISA', 'MASTERCARD', 'AMEX', 'CREDIT CARD', 'TD VISA'])) {
      return { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT' };
    }
    if (this.matchesPattern(desc, ['E-TRANSFER', 'E-TFR', 'INTERAC', 'E-TRANS'])) {
      return { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_ACCOUNT_TRANSFER' };
    }
    if (this.matchesPattern(desc, ['ATM', 'BANK MACHINE', 'WITHDRAWAL'])) {
      return { primary: 'BANK_FEES', detailed: 'BANK_FEES_ATM_FEES' };
    }
    if (this.matchesPattern(desc, ['BANK FEE', 'SERVICE CHARGE', 'MONTHLY FEE'])) {
      return { primary: 'BANK_FEES', detailed: 'BANK_FEES_OVERDRAFT_FEES' };
    }
    if (this.matchesPattern(desc, ['INTEREST', 'INTEREST PAYMENT'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING' };
    }

    // Healthcare
    if (this.matchesPattern(desc, ['PHARMACY', 'DRUG', 'PRESCRIPTION', 'MEDICATION', 'SHOPPERS', 'REXALL'])) {
      return { primary: 'MEDICAL', detailed: 'MEDICAL_PHARMACIES' };
    }
    if (this.matchesPattern(desc, ['DENTIST', 'DENTAL', 'ORTHODONTIST'])) {
      return { primary: 'MEDICAL', detailed: 'MEDICAL_DENTAL_CARE' };
    }
    if (this.matchesPattern(desc, ['DOCTOR', 'CLINIC', 'HOSPITAL', 'MEDICAL', 'PHYSICIAN'])) {
      return { primary: 'MEDICAL', detailed: 'MEDICAL_PRIMARY_CARE' };
    }
    if (this.matchesPattern(desc, ['VET', 'VETERINARY', 'PET CARE'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_VETERINARY_SERVICES' };
    }

    // Education
    if (this.matchesPattern(desc, ['TUITION', 'UNIVERSITY', 'COLLEGE', 'SCHOOL', 'EDUCATION'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_EDUCATION' };
    }
    if (this.matchesPattern(desc, ['BOOKSTORE', 'TEXTBOOK', 'COURSE'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_EDUCATION' };
    }

    // Income
    if (this.matchesPattern(desc, ['PAYROLL', 'SALARY', 'PAYCHECK', 'PAY', 'EMPLOYMENT'])) {
      return { primary: 'INCOME', detailed: 'INCOME_WAGES' };
    }
    if (this.matchesPattern(desc, ['GST', 'HST', 'TAX REFUND', 'TAX RETURN'])) {
      return { primary: 'INCOME', detailed: 'INCOME_TAX_REFUND' };
    }
    if (this.matchesPattern(desc, ['DEPOSIT', 'DEPOSIT FROM'])) {
      return { primary: 'INCOME', detailed: 'INCOME_OTHER_INCOME' };
    }
    if (this.matchesPattern(desc, ['DIVIDEND', 'INTEREST INCOME'])) {
      return { primary: 'INCOME', detailed: 'INCOME_DIVIDENDS' };
    }

    // Subscriptions & Services
    if (this.matchesPattern(desc, ['SUBSCRIPTION', 'MONTHLY', 'ANNUAL'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_SUBSCRIPTIONS' };
    }
    if (this.matchesPattern(desc, ['SOFTWARE', 'SaaS', 'CLOUD'])) {
      return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_COMPUTER_AND_SOFTWARE' };
    }

    // Default
    return { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_OTHER' };
  }

  /**
   * Helper method to check if description matches any of the provided patterns
   */
  private matchesPattern(description: string, patterns: string[]): boolean {
    return patterns.some(pattern => description.includes(pattern));
  }
}
