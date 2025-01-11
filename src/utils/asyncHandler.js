const asyncHandler = (requestHandler) => {
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>{next(err)})
    }
}

export default asyncHandler;


// const asynca = (fn) => async () =>{
//     try {
//         fn(req,res,next)
//     } catch (error) {
//         console.log(error);
//         res.status(err.status).json({
//             success : false, message : err.message
//         })
//     }
// }