// send successMessage for successfull request
const sendSuccessMessage = (res,message = "success", data,statusCode=200)=>{
    res.status(statusCode).json({
       success:true,
       data,
       message
    })
};
// for the errorsend message send as response
const sendErrorMessage = (res,message = "failed",err,statusCode=400)=>{
  res.status(statusCode).json({
      success:false,
      message,
      err,
   })
}

export {
   sendSuccessMessage,
   sendErrorMessage
}