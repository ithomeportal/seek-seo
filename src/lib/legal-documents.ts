/**
 * Source of truth for the onboarding legal-document text, transcribed from the
 * SEEK source files (ACH Debits Authorization + Equipment Rental Agreement /
 * Personal Guaranty, rev. 04-06-2026-2). Consumed by BOTH the in-app renderer
 * (src/components/portal/*) and the pdf-lib builders (src/lib/*-pdf.ts) so the
 * on-screen text and the signed PDF never drift.
 *
 * Keep all text WinAnsi-safe (Helvetica/pdf-lib): plain ASCII quotes/dashes
 * only — no Unicode checkmarks or smart punctuation.
 */

export type DocBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'clause'; num: string; text: string }
  | { kind: 'item'; text: string }
  | { kind: 'note'; text: string }

/** Phrase shown wherever a deal-specific amount/date is set per rental, not by the customer. */
export const PER_SCHEDULE = 'Per individual rental schedule'

export const COMPANY_LEGAL_NAME = 'Seek Equipment Rental, LLC'

/* ------------------------------------------------------------------ */
/*  ACH Debits Authorization                                          */
/* ------------------------------------------------------------------ */

export const ACH_TITLE =
  'AUTHORIZATION AGREEMENT FOR DIRECT PAYMENTS (ACH DEBITS)'

export const ACH_BLOCKS: DocBlock[] = [
  {
    kind: 'paragraph',
    text: `I (we) hereby authorize ${COMPANY_LEGAL_NAME}, hereinafter called COMPANY, to initiate debit entries to my (our) Checking Account or Savings Account (selected below) indicated below at the depository financial institution named below, hereinafter called DEPOSITORY, and to debit the same to such account. I (we) acknowledge that the origination of ACH transactions to my (our) account must comply with the provisions of U.S. law.`,
  },
  {
    kind: 'paragraph',
    text: `This authorization is to remain in full force and effect until COMPANY has received written notification from me (or either of us) of its termination in such time and in such manner as to afford COMPANY and DEPOSITORY a reasonable opportunity to act on it.`,
  },
  {
    kind: 'note',
    text: `NOTE: ALL WRITTEN DEBIT AUTHORIZATIONS MUST PROVIDE THAT THE RECEIVER MAY REVOKE THE AUTHORIZATION ONLY BY NOTIFYING THE ORIGINATOR IN THE MANNER SPECIFIED IN THE AUTHORIZATION.`,
  },
]

/* ------------------------------------------------------------------ */
/*  Equipment Rental Agreement                                        */
/* ------------------------------------------------------------------ */

export const LEASE_TITLE = 'Equipment Rental Agreement'

export const LEASE_INTRO: DocBlock[] = [
  {
    kind: 'paragraph',
    text: `This Lease agreement is by and between Seek Equipment Rental LLC, and its subsidiary and affiliated entities, with its principal place of business in 16414 San Pedro Avenue, San Antonio, Texas ("Lessor") and the Lessee identified in the signature block below ("Lessee"). Lessor leases and Lessee leases from lessor the equipment described in the applicable rental schedule.`,
  },
  { kind: 'paragraph', text: `NOW, THEREFORE, the parties agree as follows:` },
]

export const LEASE_BLOCKS: DocBlock[] = [
  {
    kind: 'clause',
    num: '1.',
    text: `Ownership And Term. Lessee acknowledges that title to the Equipment will at all times be vested in Seek Equipment Rental, LLC., and no right, title, or interest in the Equipment will pass to Lessee other than, conditioned upon Lessee's compliance with the Lease, the right to possess and use the Equipment as provided in the Lease. Lessee understands that Seek Equipment Rental, LLC has the right to visually inspect its Equipment at any time. Lessee agrees not to sell, assign, sublet, pledge, or otherwise encumber any interest in the Lease or the Equipment and agrees to keep the same free from any lien, encumbrance, right of distraint or any other claim that may be asserted by any third party. Lessee will immediately notify Seek Equipment Rental, LLC in writing of any tax or other liens attaching to the Equipment. Seek Equipment Rental, LLC may require plates or markings to be affixed to or placed on the Equipment indicating Seek Equipment Rental, LLC interest. Seek Equipment Rental, LLC and Lessee hereby confirm their intent that the Equipment always remain and be deemed personal property even though the Equipment may hereafter become attached or affixed to realty. Lessee will obtain all such waivers as Seek Equipment Rental may reasonably require acknowledging Seek Equipment Rental, LLC title to and assure Seek Equipment Rental, LLC right to remove the Equipment, including any landlord and mortgagee waivers. In the event a court of competent jurisdiction determines that the Lease represents a conditional sale or financing arrangement, Lessee grants Seek Equipment Rental, LLC a continuing first priority security interest in the Equipment and all proceeds thereof to secure Lessee's obligations under the Lease.`,
  },
  {
    kind: 'clause',
    num: '2.',
    text: `Acceptance Of Seek Equipment Rentals LLC Equipment. Lessee's Agent will supply a valid commercial driver's license and sign Equipment Rental Agreement binding Lessee to the terms and conditions of this agreement before taking possession of the Equipment. Lessee acknowledges that Lessee has authorized Lessee's Agent, if applicable, to pick-up and/or return the Equipment to the location set forth in the Lease and that the signature of Lessee's Agent on an Equipment Rental Agreement will bind Lessee to the terms thereof. When Lessee takes possession of the Equipment, Lessee agrees to accept the Equipment in the condition as reported in the Rental Agreement unless contested by Lessee's Agent at the time of pick-up. Lessee acknowledges that Lessee took possession of the Equipment in good repair and working condition. Equipment will be returned to Seek Equipment Rental in the same condition reported in the Rental Agreement, with the exception of Normal Wear. Unless otherwise set forth in the Lease, Lessee, at its expense, will return the Equipment to the Seek Equipment Rental location from which Lessee picked up the Equipment. In the event that Lessee returns the Equipment to a Seek Equipment Rental location other than such location described in the foregoing sentence, a drop charge of up to one thousand dollars ($1,000.00) for vans and two thousand dollars ($2,000.00) for specialized equipment may apply; provided, that in any event Seek Equipment Rental prior written consent to return the Equipment to any such other location will be required. If Seek Equipment Rental closes the branch location where the Equipment originated, Lessee agrees to return the Equipment to the closest branch to the originating branch, or such other Seek Equipment Rental branch location as Seek Equipment Rental and Lessee may mutually agree.`,
  },
  {
    kind: 'clause',
    num: '3.',
    text: `Rental Payment. The rent is ${PER_SCHEDULE} dollars per month for a 12-month period payable in notice from the beginning of this lease contract in favor of the lessor.`,
  },
  {
    kind: 'clause',
    num: '4.',
    text: `Automatic Payment. Lessee authorizes Seek Equipment Rental, to automatically deduct the monthly payment from the Lessee associated deposit account on the due date shown on this agreement. It is lessee's responsibility to ensure that there are sufficient funds available in the deposit account to make the monthly payment. If lessee doesn't count with sufficient funds and lessor does not receive the amount at the due date of this agreement, lessee will be charged a late payment fee of $50.00 dollars, this fee will be charged starting on the 3rd business day of nonpayment, a $50 dollars, per day charge will be applied daily until the past due amount has been paid in full.`,
  },
  {
    kind: 'clause',
    num: '5.',
    text: `Payment Terms. The Lessee agrees to pay the Lessor the amount corresponding to the rent amount on the 1st (first) day of each month.`,
  },
  {
    kind: 'clause',
    num: '6.',
    text: `Payment Method; ACH Authorization & Obligations.`,
  },
  {
    kind: 'item',
    text: `(a) Payment Method. Lessee authorizes Lessor to present invoices electronically and to apply payments first to fees and costs, then to accrued interest, and then to Base Rent.`,
  },
  {
    kind: 'item',
    text: `(b) ACH Authorization. Lessee hereby authorizes Lessor and its processors to initiate recurring ACH debits from the bank account designated by Lessee for all amounts owed under this Agreement and any Schedule, including Base Rent and Additional Rent, and to initiate credits for error correction. Lessee agrees not to revoke this authorization except upon thirty (30) days' prior written notice to Lessor and payment in full of all outstanding amounts.`,
  },
  {
    kind: 'item',
    text: `(c) Funds Sufficiency; Notice. Lessee shall maintain sufficient funds in the designated account. Lessee must provide Lessor at least ten (10) Business Days' prior written notice of any bank/account change, closure, suspected fraud affecting payment, or inability to make any payment when due.`,
  },
  {
    kind: 'item',
    text: `(d) Reversal = Default; Certified Funds. Any rejection, reversal, return, stop-payment, or dispute of a legitimate ACH debit constitutes a material Event of Default. Upon such event, all amounts owed become immediately due and payable by wire or cashier's check. Lessee shall reimburse Lessor for all related bank charges, administrative fees, and costs of collection, including attorneys' fees.`,
  },
  {
    kind: 'item',
    text: `(e) Bank Account Change; Continuing Payment Obligation. Lessee shall notify Lessor in writing of any change to the designated bank account, including account number, financial institution, or account status, no later than ten (10) Business Days before such change becomes effective. Any change of bank account shall not suspend, delay, reduce, or otherwise affect Lessee's obligation to timely make all payments due under this Agreement. Lessee acknowledges and agrees that failure to provide timely notice of an account change, or failure to ensure that payments continue to be successfully processed during or after such change, shall not excuse any missed or late payment. Any resulting failure to cover the monthly payment shall be deemed a nonpayment, subject to all late fees, daily charges, penalties, and default remedies described in this Agreement.`,
  },
  {
    kind: 'item',
    text: `(f) Right to Re-Debit. Lessor may re-debit any returned or reversed transaction and may require replacement funds in advance of continued use of any Equipment.`,
  },
  {
    kind: 'clause',
    num: '7.',
    text: `Rental Period. This Agreement begins on ${PER_SCHEDULE} and ending on ${PER_SCHEDULE}.`,
  },
  {
    kind: 'clause',
    num: '8.',
    text: `Security Deposit. Lessor and Lesse agree that the security deposit will be in the amount of ${PER_SCHEDULE} Dollars per trailer. Lessor may apply any amount of the security deposit toward any obligation of lessee under the Agreement and shall return any unapplied balance to Lessee without interest upon full satisfaction of all of Lessee's obligations.`,
  },
  {
    kind: 'clause',
    num: '9.',
    text: `Maintenance And Operation. Lessee agrees to keep the equipment in the same condition as when received and exercise all reasonable care, ordinary wear and tear excepted. Lessee acknowledges that lessee has been instructed on and fully understands the safe operation of the leased equipment and agrees to observe all safety precautions. Lessee will keep the interior of the unites as well as doors, lighting, and other appurtenances in good and substantial repair and in clean condition. Lessee agrees to pay Lessor, on return of the leased equipment, for all charges incidental to breakages, shortages, or damage, ordinary and wear and tear excepted, to the leased equipment to 16414 San Pedro Ave, Ste. 635, San Antonio, Texas, 78232. Lessee is s responsible, at its own cost, for conducting all required inspections of the Units, including, without limitation, any periodic inspections required by Applicable Law (e.g., periodic DOT inspections), and for performing all required maintenance and servicing to the Units in accordance with the Repair Standards.`,
  },
  {
    kind: 'clause',
    num: '10.',
    text: `Tire Wear Charge. If Lessee selects the net maintenance option for the Equipment, Lessee will pay Seek Equipment Rental a charge for tire wear for each one thirty-second (1/32) of an inch of tread wear on Equipment at the rate specified in the Lease. The tire depth of each tire will be measured by Seek Equipment Rental at the time of the Outbound Inspection and Inbound Inspection at the lowest point of remaining tire tread.`,
  },
  {
    kind: 'clause',
    num: '11.',
    text: `Brake Charge. If Lessee selects the net maintenance option for the Equipment, Lessee will pay Seek Equipment Rental a charge for brake lining wear for each one-eighth (1/8) of an inch of break lining wear at a rate specified in the Lease. The brake lining for each wheel end will be measured by Seek Equipment Rental at the time of the Outbound Inspection and Inbound inspection.`,
  },
  {
    kind: 'clause',
    num: '12.',
    text: `No Subletting. Lessee agrees to keep the leased equipment in lessees' custody and not to sublease or rent the equipment.`,
  },
  {
    kind: 'clause',
    num: '13.',
    text: `Use And Return. Lessee agrees that the Equipment will be utilized only for transportation to complete promptly and expeditiously the motor vehicle movement and return the Equipment to Lessor in the city and at the terminal where received, unless otherwise specified by Lessor. Lessee shall be responsible for the safe and timely return of the Equipment to Lessor, ordinary wear and tear expected. Lessee agrees not to interchange Equipment obtained from Lessor hereunder with third parties.`,
  },
  {
    kind: 'clause',
    num: '14.',
    text: `Maintenance; Repairs; Standards; Inspection; Return Condition.`,
  },
  {
    kind: 'item',
    text: `(a) Lessee's Responsibility. Lessee, at its sole cost, is responsible for all inspections, maintenance, servicing, and repairs necessary to keep the Equipment in DOT-Compliant and Rent-Ready Condition throughout the Term. Without limiting the foregoing, Lessee is responsible for brakes, tires, lights, electrical, air lines, landing gear, suspension, chassis components, and any other systems necessary for safe operation.`,
  },
  {
    kind: 'item',
    text: `(b) No "Normal Wear and Tear" Deduction. The Parties agree that "normal wear and tear" shall not reduce Lessee's responsibility to return the Equipment in Rent-Ready Condition. If any component is missing, damaged, worn beyond DOT limits, or otherwise not in Rent-Ready Condition upon return, Lessee shall pay the full cost of repair or replacement (including parts and labor) without apportionment for prior use or remaining life.`,
  },
  {
    kind: 'item',
    text: `(c) Standards & Parts. All maintenance and repairs shall conform to Lessor's written Turn-In Conditions and Acceptable Repair Standards, as amended by Lessor from time to time, and to Applicable Law. Parts and materials shall be OEM or equivalent quality.`,
  },
  {
    kind: 'item',
    text: `(d) Records. Upon request, Lessee shall provide maintenance and repair records. Any nonconforming repair may be corrected by Lessor at Lessee's expense.`,
  },
  {
    kind: 'item',
    text: `(e) Inspection Protocol. Outbound and inbound inspections may be documented using Lessor's written checklist and time-stamped photos/video. Lessor's determination of required repairs and charges will be conclusive and binding absent manifest error.`,
  },
  {
    kind: 'item',
    text: `(f) Cleaning; Decals; Telematics. Lessee shall remove all decals and personal property, return any telematics/monitoring devices undamaged, and return Equipment clean. Additional cleaning, decal removal, missing device charges, and similar items will be billed as Additional Rent.`,
  },
  {
    kind: 'clause',
    num: '15.',
    text: `Operating authority and FMCSA safety standards. Lessee shall notify Provider immediately if its federal operating authority is revoked, suspended, or rendered inactive. Lessee shall not have an "Unsatisfactory" or "Unfit" safety rating as determined by the Federal Motor Carrier Safety Administration (FMCSA).`,
  },
  {
    kind: 'clause',
    num: '16.',
    text: `Indemnification. Lessee agrees to indemnify, defend and hold Seek Equipment Rentals, LLC. (and its subsidiaries and affiliates) harmless from and against any and all claims, losses, damages, penalties, actions, suits, assessments, taxes, fines, tolls, and liabilities (including negligence, tort, and strict liability), together with all reasonable legal costs and expenses in connection therewith incurred by Seek Equipment Rental LLC (or its assigns, affiliates, successors, employees, officers, or directors) that arise out of, are incident to, result from, or relate to, the maintenance performed by Lessee or on behalf of Lessee (excluding maintenance performed by Seek Equipment Rental LLC), modification, delivery, installation, possession, use, acceptance, rejection, revocation of acceptance, operation, sublease, repair, or return of the Equipment or Monitoring Services, except as otherwise permitted herein, including, without limitation, damage or claims resulting from the presence on or under or the escape, seepage, leakage, spillage, discharge, emission, or release from the Equipment of any hazardous waste or any violation of any Applicable Law, including, without limitation, any environmental laws. Further, such indemnification includes, but is not limited to, death or injury to any person, damage to any property, including cargo, violation or alleged violation of any applicable law, and any taxes or assessments. Lessee's indemnification obligations under this Section 10 will survive the termination of the Lease.`,
  },
  {
    kind: 'clause',
    num: '17.',
    text: `Insurance. Before commencing any work hereunder, Lessee shall procure, and shall thereafter maintain in force during the period of the Agreement, all its own insurance, with insurance companies satisfactory to Lessor, covering all of the work and services to be performed hereunder by Lessee and each of its subcontractors:`,
  },
  {
    kind: 'item',
    text: `A. Lessee agrees to maintain for the duration of this Agreement, insurance coverage owned and hired automobile liability including bodily injury and property damage, with coverage of at least $1,000,000.00 combined single limit or the equivalent.`,
  },
  {
    kind: 'item',
    text: `B. Comprehensive general liability insurance insuring against liability for bodily injury, death, and property damage with a minimum limit of one million dollars ($1,000,000.00) combined single limit per occurrence. Lessee agrees to maintain for the duration of this Agreement, insurance coverage for physical damage insurance for loss or damage to Equipment while in the care, custody and/or control of the Lessee. Such coverage may be written on an actual cash value basis per unit, but in no event less than $40,000.00. Lessor shall be named as additional insured on the insurance policy.`,
  },
  {
    kind: 'item',
    text: `C. Lessee agrees to maintain for the duration of this Agreement, insurance coverage for cargo loss insurance for loss and damage to lading contained in the Equipment while in the care, custody and/or control of the Lessee. Such coverage shall be in the minimum amount of $100,000.00.`,
  },
  {
    kind: 'item',
    text: `D. All certificates of insurance must provide Lessor a minimum of thirty (30) days' notice of cancellation.`,
  },
  {
    kind: 'item',
    text: `E. Lessee agrees to notify Lessor immediately of any accident or collision. Lesse shall make a detailed report to Lessor concerning such accident or collision in writing as soon as practicable. Prior to taking possession of the Equipment and for all subsequent policy renewals or replacements, Lessee will furnish Seek Equipment Rental with a certificate of insurance evidencing the issuance of a policy or policies to Lessee in at least the minimum amounts required herein naming Seek Equipment Rental (and, at the direction of Seek Equipment Rental, any lender from which Seek Equipment Rental obtained financing for or leased the Equipment) as an additional insured thereunder for the liability coverage, naming Seek Equipment Rental as loss payee. Lessee will take all necessary action to enforce Seek Equipment Rental status as an additional insured as described herein, including, without limitation, cooperating with Seek Equipment Rental and filing insurance claims for lost or stolen Equipment. Lessee will also obtain a waiver of subrogation in favor of Seek Equipment Rental on its General Liability policy. Lessee's Automobile Liability and General Liability policies shall be primary and shall not seek contribution from Seek Equipment Rental or any of its insurers. Lessee shall provide Seek Equipment Rental with at least thirty (30) days' notice of cancellation or of material change to the policy. Lessee's policies must contain a provision requiring its insurers to provide Seek Equipment Rental with at least ten (10) days' written notice of coverage cancellation for non-payment of premium, and 30 days' written notice of cancellation for any other reason. Lessee will deliver, annually and at any time that there is a change in insurance carrier, to Seek Equipment Rental evidence satisfactory to Seek Equipment Rental of the insurance coverage required hereunder. Seek Equipment Rental will be under no duty to ascertain the existence of or to examine any such policy or to advise Lessee in the event any such policy will not comply with the requirements hereof. Insolvency, refusal or failure by Lessee's insurance carrier to provide coverage for any and all loss, claim, liability or damage arising out of the Lease shall not relieve Lessee of any obligations set forth in the Lease. Nothing contained in these insurance requirements shall be construed as limiting the extent of Lessee's liability under the Lease.`,
  },
  {
    kind: 'clause',
    num: '18.',
    text: `Risk of Loss. Lessee has the complete risk of loss or damage to the equipment and/or any item of the equipment. Loss or damage will not relieve Lessee of their obligations under this Rental Agreement. Lessee shall advise the Lessor promptly in writing of any loss or damage the equipment and/or any item of the equipment and of the circumstances and extend of the damage or loss. In the event that the equipment or any item of the equipment shall become lost, stolen, destroyed, damaged beyond repair, or rendered permanently unfit for use for any reason, or in the event of condemnation or seizure, lessee shall promptly pay Lessor an amount equal to the greater of the fair market value (as of the date of payment) of such items.`,
  },
  {
    kind: 'clause',
    num: '19.',
    text: `Repairs To Equipment. In addition to Lessee's specific maintenance and repair responsibilities, Lessee is responsible for all damage to the Equipment other than Normal Wear. To the extent Seek Equipment Rental makes any repairs to the Equipment on behalf of Lessee while on hire or upon return of the Equipment, Lessee will be charged additional fees for processing. Lessee will maintain the Equipment in accordance with Seek Equipment Rental Turn in Conditions and Acceptable Repair Standards and, upon Seek Equipment Rental request, will provide Seek Equipment Rental with written descriptions of all repairs made to the Equipment. Lessee will use trailer manufacturer grade materials and parts for all repairs and all parts, accessories, equipment, and devices used in Equipment repair will be of equal or better quality than such items that were repaired or replaced. Lessee is responsible for any non-standard repairs or defects arising from the use of improper materials or repair procedures performed by its subcontractors or affiliates and/or failing to repair in compliance with applicable laws and/or regulations, as determined by Seek Equipment Rental in its sole discretion. Any repair that fails to meet the standards set forth in this Section 6, as determined by Seek Equipment Rental in its sole discretion, will be corrected by Seek Equipment Rental at Lessee's expense, including, without limitation, all labor, drayage, road service, maintenance, mileage, or other charges. If there is an Event of Loss with respect to any Equipment, Lessee will pay to Seek Equipment Rental on the Loss Value of the Equipment; plus (i) all Lease and other payments due relating to such Equipment but unpaid until the date the Loss Value payment is received by Seek Equipment Rental; (ii) all labor, drayage, maintenance, mileage, road service, storage, or other charges relating to such Equipment; (iii) all charges related to recovery of such Equipment; and (iv) the estimated or actual cost, at Seek Equipment Rental option, of Equipment Monitoring Devices relating to such Equipment that is owned by Seek Equipment Rental unless such Equipment Monitoring Devices are returned to Seek Equipment Rental undamaged, whereupon the Lease will terminate as to such Equipment and Seek Equipment Rental will adjust the remaining Lease Payments and Loss Value accordingly.`,
  },
  {
    kind: 'clause',
    num: '20.',
    text: `Notice. Any notice to be given under this lease shall be mailed to the party to be notified at the address set forth in this lease, by registered or certified mail with postage prepaid, and shall be deemed given so mailed. This Rental constitutes the full agreement between the Lessor and Lesse.`,
  },
  {
    kind: 'clause',
    num: '21.',
    text: `Governing law. This Agreement is governed by the laws of the state of Texas, the state in which our office is located, in which final approval of the terms and conditions of this Agreement occurred and form which payment for the equipment will be ordered.`,
  },
  {
    kind: 'clause',
    num: '22.',
    text: `Miscellaneous. A party may not assign this contract without the written consent of the other. This contract shall inure to the benefit of and be enforceable by the parties and their lawful successors, heirs, and permitted assigns. This contract may not be amended or changed, and no term, covenant, or condition may be waived, except in a writing signed by the parties' authorized representatives. The waiver of any breach of any term or condition shall not be deemed to constitute the waiver of any other breach of the same or any other term or condition. If one or more of the provisions shall be held invalid, illegal, or unenforceable, such invalidity, illegality, or unenforceability shall not affect any other provision. With respect to its subject matter, this agreement constitutes the entire agreement intended by and between the parties and supersedes all prior agreements.`,
  },
  { kind: 'clause', num: '23.', text: `Standard Terms and Conditions.` },
  {
    kind: 'item',
    text: `1. Lessee is responsible for all insurance coverage on the equipment, during the rental term, and will provide evidence of thereof.`,
  },
  {
    kind: 'item',
    text: `2. Lessee and/or operator hereby warrants that they are familiar with the safe operation and use of the equipment herein noted.`,
  },
  {
    kind: 'item',
    text: `3. Lessee is responsible for fuel, lubricants, and daily maintenance. All leaks, changes in performance/operation, unusual noises or conditions indicating or relating to potential failure must be reported to the Lessor immediately.`,
  },
  {
    kind: 'item',
    text: `4. Lessee will be charged for damage to equipment and caused by negligence, abuse, accident, failure to maintain proper fluid levels and inappropriate use of the equipment. Lessee will be charged for excessive undercarriage and tire wear.`,
  },
  { kind: 'item', text: `5. Lessee is responsible for all liability in connection with use of equipment.` },
  { kind: 'item', text: `6. Equipment must be returned in "Rent Ready Condition".` },
  { kind: 'item', text: `7. Equipment must be returned the equipment full of fuel.` },
  {
    kind: 'item',
    text: `8. Lessee agrees to hold harmless Lessor for all claims, delays, actions, suits, damages, and liabilities, including attorney fees, arising from the rented equipment.`,
  },
  { kind: 'item', text: `9. Lessee is responsible for all freight including assembly and disassembly as required.` },
  {
    kind: 'item',
    text: `10. The Lessee agrees to return the vehicle to the lessor on the agreed date and place, as written in the contract, or earlier if the lessor so insists.`,
  },
  { kind: 'item', text: `11. The Lessee agrees that the payment method is carried out with automatic payments.` },
  { kind: 'clause', num: '24.', text: `Default And Remedies.` },
  {
    kind: 'item',
    text: `I. Upon the occurrence of any Default, Seek Equipment Rental may exercise any one or more of the following remedies (which remedies will be cumulative, and may be exercised simultaneously, in each case to the extent permitted by Applicable Law): (i) cancel or terminate the Lease (provided that these Terms and Conditions will remain in effect until such time that the Equipment is returned to Seek Equipment Rental); (ii) secure peaceable repossession and removal of the Equipment by Seek Equipment Rental or its agent without judicial process at Lessee's expense, including, without limitation, reasonable attorneys' fees; (iii) demand and Lessee will return the Equipment to "Seek Equipment Rental" in accordance with the standards set forth in these agreement (iv) demand and Lessee will pay all reasonable expenses in connection with the Equipment relating to its retaking, returning to required condition, leasing, or the like; and (v) exercise any other right or remedy that may be available to it under the Uniform Commercial Code or any other Applicable Law. To the extent permitted by Applicable Law, Lessee waives all rights it may have to limit or modify any of "Seek Equipment Rental" rights and remedies hereunder, including, without limitation, any right of Lessee to require "Seek Equipment Rental" to dispose of or marshal the Equipment or otherwise mitigate its damages hereunder.`,
  },
  {
    kind: 'item',
    text: `II. Upon the occurrence of any Default, "Seek Equipment Rental" may exercise one or more of the following remedies in addition to the remedies set forth in Section above (which remedies will be cumulative, and may be exercised simultaneously, in each case to the extent permitted by Applicable Law): (i) by notice to Lessee, as liquidated damages for loss of a bargain and not as a penalty, declare immediately due and payable (A) all past due but unpaid Lease Payments through such applicable Payment Period, and (B) all other amounts due under the Lease (including late charges), whereupon such will become immediately due and payable; (ii) declare all remaining Lease Payments for the balance of the Lease Term, such sum discounted at the Discount Rate, plus all other due but unpaid Lease Payments and all other amounts due under the Lease (including late charges), immediately due and payable in full, whereupon such will become immediately due and payable; (iii) to apply to "Seek Equipment Rental" account any amounts owed by "Seek Equipment Rental" to or for the account of Lessee as setoff against any amounts owed by Lessee to "Seek Equipment Rental"; (iv) to draw down the full amount available under any LOC; and (v) exercise any other rights or remedies otherwise available to "Seek Equipment Rental" at law or in equity.`,
  },
  {
    kind: 'item',
    text: `III. Lessee understands that should "Seek Equipment Rental" terminate the Lease and Lessee fail to return the Equipment to "Seek Equipment Rental" within ten (10) business days of request by 'Seek Equipment Rental'', the Equipment will be consider stolen by Lessee and that "Seek Equipment Rental" may report such stolen Equipment to the appropriate authorities. Should "Seek Equipment Rental" be required to repossess the Equipment and such Equipment contains property belonging to Lessee or a third party, Lessee agrees "Seek Equipment Rental" may remove, store, sell or dispose of such property, and that Lessee will reimburse "Seek Equipment Rental" for all such expenses, including but not limited to, expenses related to the sale, storage and/or care of the property. Lessee agrees that "Seek Equipment Rental" is under no obligation to determine whether such property belongs to Lessee or another third party and agrees to indemnify and hold "Seek Equipment Rental" harmless for any such claim, demand or cause of action arising from or relating to "Seek Equipment Rental" taking possession of and/or storing, selling or disposing of such property, including reimbursing "Seek Equipment Rental" for all of its attorneys' fees and costs.`,
  },
  {
    kind: 'item',
    text: `IV. Default and Acceleration of Obligations. Upon the occurrence of an Event of Default, and without prejudice to any other rights or remedies available to Lessor, Lessor may, at its option and without further notice: a. Accelerate Payment. b. Declare all amounts due or to become due under this agreement for the remainder of the Rental Term immediately due and payable, including, without limitation: All unpaid Rent accrued to the date of default; All future Rent for the remainder of the Rental Term; Late fees, penalties, and interest; Costs of recovery, repair, storage, and transportation of the equipment; and All enforcement costs, including reasonable attorneys' fees and expenses.`,
  },
  {
    kind: 'clause',
    num: '25.',
    text: `Waiver and Amendment. No waiver of any provision of the Lease will be effective unless, in writing, signed by the party to be charged. Further, no amendment, supplement, or other modification of the Lease will be effective unless, in writing, signed by each of the parties to the Lease. Notwithstanding the foregoing, 'Seek Equipment Rental" may change the Terms and Conditions and/or applicable Lease upon 30 days' notice to Lessee. No failure to exercise, no delay in exercising, and no single or partial exercise on the part of "Seek Equipment Rental" of any right, remedy, or power under the Lease, will operate as a waiver thereof or preclude "Seek Equipment Rental" from exercising any other right, remedy or power under the Lease. Any provision of the Lease that is unenforceable in any jurisdiction will, as to such jurisdiction, be ineffective to the extent of such prohibition or unenforceability, without invalidating the remaining provisions of the Lease.`,
  },
  {
    kind: 'clause',
    num: '26.',
    text: `Choice of Law and Jury Trial Waiver. THE AGREEMENT (A) HAS BEEN ACCEPTED BY SEEK EQUIPMENT RENTAL IN, AND FOR ALL PURPOSES WILL BE DEEMED A CONTRACT ENTERED INTO IN, THE STATE OF TEXAS, AND (B) WILL BE GOVERNED AND CONSTRUED IN ACCORDANCE WITH THE LAWS OF THE STATE OF TEXAS WITHOUT GIVING EFFECT TO THE PRINCIPLES OF CONFLICT OF LAWS THEREOF. LESSEE AND SEEK EQUIPMENT RENTAL EACH HEREBY SUBMIT TO THE JURISDICTION OF THE STATE AND FEDERAL COURTS SITTING IN SAN ANTONIO, TEXAS FOR PURPOSES OF ADJUDICATING ANY ACTION ARISING OUT OF OR RELATED TO THE LEASE, AND HEREBY WAIVE, TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, ANY OBJECTION TO THAT VENUE FOR ANY ACTION ARISING OUT OF OR RELATED TO THE LEASE. SEEK EQUIPMENT RENTAL RESERVES ITS RIGHT TO BRING SUIT IN ANY OTHER APPROPRIATE JURISDICTION. LESSEE AND SEEK EQUIPMENT RENTAL EACH IRREVOCABLY WAIVE ALL RIGHTS TO A JURY TRIAL IN ANY LITIGATION ARISING FROM OR RELATED IN ANY WAY TO THE LEASE OR THE TRANSACTIONS CONTEMPLATED THEREBY IN WHICH LESSEE AND SEEK EQUIPMENT RENTAL ARE ADVERSE PARTIES.`,
  },
]

/* ------------------------------------------------------------------ */
/*  Personal Guarantee of Equipment Rental Obligations                */
/* ------------------------------------------------------------------ */

export const GUARANTY_TITLE = 'PERSONAL GUARANTEE OF EQUIPMENT RENTAL OBLIGATIONS'
export const GUARANTY_SUBTITLE =
  '(Separate and Independent Obligation - Not Part of Rental Agreement)'

export const GUARANTY_BLOCKS: DocBlock[] = [
  {
    kind: 'paragraph',
    text: `Creditor (Equipment Owner): SEEK Equipment Rental, LLC, IH-35, Von Ormy, Texas 78073, Bexar County, Texas.`,
  },
  {
    kind: 'paragraph',
    text: `WHEREAS, SEEK Equipment Rental, LLC ("SEEK" or "Creditor") has agreed or may agree from time to time to enter into equipment rental agreements (each, a "Rental Agreement") with the company identified above as Principal ("Principal") for the lease of trailers, sand chassis, belly dumps, sand hoppers, tankers, and/or other equipment; and`,
  },
  {
    kind: 'paragraph',
    text: `WHEREAS, SEEK requires, as a condition of entering into any Rental Agreement with Principal, that the undersigned individual ("Guarantor") provide this unconditional and absolute personal guarantee of all obligations of Principal; and`,
  },
  {
    kind: 'paragraph',
    text: `WHEREAS, Guarantor has a direct financial interest in Principal and will directly benefit from SEEK's agreement to rent equipment to Principal;`,
  },
  {
    kind: 'paragraph',
    text: `NOW, THEREFORE, in consideration of SEEK's agreement to rent equipment to Principal, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, Guarantor agrees as follows:`,
  },
  {
    kind: 'clause',
    num: '1.',
    text: `UNCONDITIONAL GUARANTEE. Guarantor hereby absolutely, unconditionally, and irrevocably guarantees to SEEK the full and prompt payment and performance of all present and future obligations of Principal under any and all Rental Agreements, including without limitation:`,
  },
  { kind: 'item', text: `(a) all monthly rental payments when due;` },
  { kind: 'item', text: `(b) all late fees ($150.00 flat fee plus $25.00 per day after the 5-day grace period);` },
  { kind: 'item', text: `(c) all returned check fees and ACH rejection fees ($75.00 per occurrence);` },
  { kind: 'item', text: `(d) the accelerated balance of all remaining months on any Rental Agreement upon default;` },
  { kind: 'item', text: `(e) all costs of equipment recovery, transport, and storage after repossession;` },
  { kind: 'item', text: `(f) all costs to repair damage to equipment beyond normal wear and tear;` },
  { kind: 'item', text: `(g) all court costs, filing fees, and service fees incurred by SEEK in enforcing this Guarantee; and` },
  {
    kind: 'item',
    text: `(h) all reasonable attorney's fees incurred by SEEK in enforcing this Guarantee, whether or not suit is filed.`,
  },
  {
    kind: 'clause',
    num: '2.',
    text: `GUARANTEE IS ABSOLUTE AND INDEPENDENT. This Guarantee is an absolute, unconditional, and independent obligation of Guarantor, separate from the obligations of Principal. SEEK may enforce this Guarantee directly against Guarantor without first demanding payment from Principal, exhausting remedies against Principal, repossessing the equipment, or obtaining any judgment against Principal. Guarantor's obligations under this Guarantee shall not be affected, reduced, or discharged by:`,
  },
  { kind: 'item', text: `(a) any modification, extension, or renewal of any Rental Agreement;` },
  { kind: 'item', text: `(b) any failure by SEEK to repossess or sell the equipment;` },
  { kind: 'item', text: `(c) the insolvency, bankruptcy, dissolution, or death of Principal;` },
  { kind: 'item', text: `(d) any release or compromise of Principal's obligations by SEEK;` },
  {
    kind: 'item',
    text: `(e) any other circumstance that might otherwise constitute a legal or equitable discharge of a guarantor.`,
  },
  {
    kind: 'clause',
    num: '3.',
    text: `ACCELERATION UPON DEFAULT. Upon Principal's failure to make any payment when due under any Rental Agreement and such failure continuing for fifteen (15) calendar days without cure, SEEK may, at its sole option, declare the entire outstanding balance of all Rental Agreements immediately due and payable, including all remaining monthly payments for the full unexpired term of each Agreement. Guarantor shall be jointly and severally liable for all such accelerated amounts.`,
  },
  {
    kind: 'clause',
    num: '4.',
    text: `GPS MONITORING AND EQUIPMENT RECOVERY. Guarantor acknowledges that all equipment rented by SEEK is equipped with GPS tracking devices (Skybitz or equivalent). Guarantor expressly consents to SEEK's monitoring of all rented equipment at all times. Upon default, SEEK has the absolute right to locate and repossess the equipment without prior notice, demand, or court order. Guarantor agrees not to interfere with, conceal, disable, or remove any GPS device, and acknowledges that doing so may constitute criminal tampering under Texas law.`,
  },
  {
    kind: 'clause',
    num: '5.',
    text: `WAIVER OF DEFENSES. Guarantor waives: (a) notice of acceptance of this Guarantee; (b) notice of any Rental Agreement entered into between SEEK and Principal; (c) notice of default by Principal; (d) demand for payment; (e) presentment; (f) protest; (g) all suretyship defenses; and (h) any right to require SEEK to proceed against Principal or any collateral before proceeding against Guarantor.`,
  },
  {
    kind: 'clause',
    num: '6.',
    text: `CONTINUING GUARANTEE. This Guarantee is a continuing guarantee and shall apply to all Rental Agreements between SEEK and Principal, whether now existing or entered into in the future, until Guarantor provides written notice of revocation to SEEK by certified mail. Revocation shall only apply to Rental Agreements entered into after SEEK's actual receipt of the written notice and shall not affect any existing obligations.`,
  },
  {
    kind: 'clause',
    num: '7.',
    text: `VENUE, JURISDICTION, AND GOVERNING LAW. This Guarantee shall be governed by the laws of the State of Texas. Guarantor irrevocably consents to the exclusive jurisdiction and venue of the Justice Courts of Bexar County, Texas (or the County Court at Law of Bexar County for amounts exceeding Justice Court jurisdiction) for any action to enforce this Guarantee. Guarantor waives any objection to venue in Bexar County, Texas, and waives any right to transfer the case to another county. Guarantor further agrees that service of process may be made by certified mail to the address listed on this Guarantee.`,
  },
  {
    kind: 'clause',
    num: '8.',
    text: `ATTORNEY'S FEES AND COSTS. In any action to enforce this Guarantee, SEEK shall be entitled to recover all reasonable attorney's fees, court costs, service fees, and collection costs incurred, whether or not a lawsuit is filed. This provision shall be enforceable under Texas Civil Practice & Remedies Code Section 38.001 and under the terms of this Guarantee.`,
  },
  {
    kind: 'clause',
    num: '9.',
    text: `CREDIT AUTHORIZATION. Guarantor authorizes SEEK to obtain a consumer or business credit report on Guarantor and Principal at any time, including at the time of application and periodically during the rental relationship, for purposes of credit evaluation and collections.`,
  },
  {
    kind: 'clause',
    num: '10.',
    text: `SEVERABILITY. If any provision of this Guarantee is found to be unenforceable, the remaining provisions shall remain in full force and effect. No waiver by SEEK of any breach shall constitute a waiver of any subsequent breach. This Guarantee may not be modified except by a written instrument signed by an authorized officer of SEEK.`,
  },
  {
    kind: 'clause',
    num: '11.',
    text: `ENTIRE AGREEMENT. This Personal Guarantee constitutes the entire agreement between SEEK and Guarantor with respect to the personal guarantee of Principal's obligations and supersedes all prior discussions and representations. Guarantor acknowledges that no promises have been made by SEEK other than those set forth herein, and that Guarantor has had the opportunity to consult with an attorney before signing.`,
  },
]

export const GUARANTY_ACKNOWLEDGMENT_TITLE = 'GUARANTOR ACKNOWLEDGMENT'
export const GUARANTY_ACKNOWLEDGMENT_INTRO = 'BY SIGNING BELOW, GUARANTOR ACKNOWLEDGES THAT:'
export const GUARANTY_ACKNOWLEDGMENT_ITEMS: string[] = [
  '(1) Guarantor has read and fully understands this Personal Guarantee;',
  '(2) Guarantor is signing this Guarantee freely and voluntarily, without coercion;',
  "(3) Guarantor understands that this Guarantee creates a personal financial obligation that is separate from and independent of the renting company's obligations;",
  '(4) Guarantor understands that SEEK may sue Guarantor personally in Bexar County, Texas without first suing the company;',
  '(5) Guarantor has had the opportunity to consult with an attorney before signing; and',
  "(6) This Guarantee is enforceable against Guarantor's personal assets, including bank accounts, real property, and personal property.",
]
