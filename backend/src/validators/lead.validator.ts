// import { z } from "zod";

// export const createLeadSchema = z.object({
//   phone_number: z.string().min(10, "Phone must be at least 10 digits"),
//   farmer_name: z.string().min(1, "Farmer name is required"),
//   farmer_type: z.string().optional(),
//   bull_centre: z.string().optional(),
//   district: z.string().optional(),
//   village: z.string().optional(),
//   farming_crops: z.string().optional(),
//   total_land_bigha: z
//     .number({ message: "Total land must be a number" })
//     .nonnegative(),
//   interested_in_warehouse: z.boolean().optional(),
//   previous_experience: z.string().optional(),
// });