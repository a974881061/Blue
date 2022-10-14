var obj = JSON.parse($response.body); 
// 可以合并一句带过

obj = jsonp_356249_({"status":"1","regeocode":{"addressComponent":{"city":"福州市","province":"福建省","adcode":"350121","district":"闽侯县","towncode":"350121107000","streetNumber":{"number":"9号","location":"119.243462,26.088417","direction":"西","distance":"241.515","street":"高新大道"},"country":"中国","township":"上街镇","businessAreas":[[]],"building":{"name":[],"type":[]},"neighborhood":{"name":[],"type":[]},"citycode":"0591"},"formatted_address":"福建省福州市闽侯县上街镇创新路"},"info":"OK","infocode":"10000"})
  
// 有需要全部替换的情况，只需让用户在这里如此操作即可

$done({body:JSON.stringify(obj)});
// 也一句带过
