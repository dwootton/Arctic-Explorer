
clear; close all; more off;

% cd 'C:\Users\Delaney\Documents\Research!';

% for mo = 1:6
% 
%     for d = 1:eomday(2016,mo)
% 
%         fname = ['seaice_conc_daily_nh_f17_2016' sprintf('%02d',mo) sprintf('%02d',d) '_v03r01.nc'];
% 
%         ncdisp(fname);
all_data = []
months = ['01','02','03','04','05','06','07','08','09', '10', '11', '12'];
years = [ '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'];
% '1980', '1981', '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989'
change_years = {'1992','1996','2008'}
f_nums = ['08','11','13','17']

counter = 1;
data_counter = 1;
all_year = [];
d=zeros(304,448,37);
total_vals = 1;
endvals = zeros(1000,1);

for year_indx = 1:4:length(years)
    year_num = strcat(years(year_indx), years(year_indx+1), years(year_indx+2), years(year_indx+3))
    %year_to_change = strcat(change_years(counter),change_years(counter+1),change_years(counter+2),change_years(counter+3))
    if ismember(year_num, change_years)
        counter = counter + 2
    end
    
    f_num = strcat(f_nums(counter),f_nums(counter+1)) 
    
    for idx = 1:2:length(months)
        month_num = strcat(months(idx),months(idx+1));

        fname = strcat('RawData/seaice_conc_monthly_nh_f',f_num,'_', year_num, month_num, '_v03r01.nc')

        %fname = 'seaice_conc_daily_nh_f17_20170101_v03r01.nc';
        %ncdisp(fname);

        lat = ncread(fname,'latitude');
        lon = ncread(fname,'longitude');

        psi = ncread(fname,'seaice_conc_monthly_cdr');
        
       
        psi(psi<0) = NaN;
        
        psi(psi < 0.01) = 0;
        d(:,:,data_counter) = psi;
        
        endval(total_vals) = mean(mean(psi,'omitnan'));
        total_vals = total_vals + 1;
        

        %all_data = [all_data, months_JSON];
        data_counter = data_counter + 1
    end  
end
% Saves the total concentration

% process 
total_concentration =  savejson('psijson',endval);

fid = fopen('totalConcentration.json', 'w');
if fid == -1, error('Cannot create JSON file'); end
fwrite(fid, total_concentration, 'char');
fclose(fid);

% Processes psi to a struct format
clear structure;
[max_rows,max_cols,max_depth] = size(d);
psi_localized = [];
%%
data_counter = data_counter - 1;

for row = 1:max_rows
    
    for col = 1:max_cols
        current_lat = lat(row,col);
        current_long = lon(row,col);
        current_array = zeros(1,data_counter);
        for data_point = 1:data_counter 
            current_array(data_point) = d(row,col,data_point);

        end
        if(~any(current_array))
            continue;
        end
        
        lat_lon_name = strcat('l',num2str(current_lat),'x', num2str(current_long));
        lat_lon_name = strrep(lat_lon_name,'.','_');
        lat_lon_name = strrep(lat_lon_name,'-','neg');

        structure.(lat_lon_name)= current_array;
    end
end
%% Write to a file
lat_long_data =  savejson('positions',structure);

fid = fopen('lat_long_data.json', 'w');
if fid == -1, error('Cannot create JSON file'); end
fwrite(fid, lat_long_data, 'char');
fclose(fid);
